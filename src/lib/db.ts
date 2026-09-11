import { getDatabase } from '@/lib/mongodb';
import type {
  CategorySlug,
  CompetitionSettings,
} from '@/lib/types';

export const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  SUBMISSIONS: 'submissions',
  VOTES: 'votes',
  SETTINGS: 'settings',
} as const;

export const SETTINGS_DOCS = {
  COMPETITION: 'competition',
} as const;

import {
  CATEGORY_SEEDS,
  DEFAULT_COMPETITION_SETTINGS,
  isSubmissionsActive,
  isVotingActive,
} from '@/lib/constants';

export {
  CATEGORY_SEEDS,
  DEFAULT_COMPETITION_SETTINGS,
  isSubmissionsActive,
  isVotingActive,
};

let initPromise: Promise<void> | null = null;

export async function ensureDefaultData(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await getDatabase();

      // Create indexes
      await Promise.all([
        db.collection(COLLECTIONS.VOTES).createIndex(
          { userId: 1, categoryId: 1 },
          { unique: true }
        ),
        db.collection(COLLECTIONS.USERS).createIndex(
          { email: 1 },
          { unique: true }
        ),
        db.collection(COLLECTIONS.SUBMISSIONS).createIndex(
          { categoryId: 1, status: 1 }
        ),
        db.collection(COLLECTIONS.SUBMISSIONS).createIndex(
          { participantId: 1 }
        ),
      ]).catch((err) => {
        console.warn('Index creation warning:', err);
      });

      // Seed categories if empty
      const categoriesCol = db.collection(COLLECTIONS.CATEGORIES);
      for (const cat of CATEGORY_SEEDS) {
        await categoriesCol.updateOne(
          { id: cat.id },
          {
            $setOnInsert: {
              ...cat,
              createdAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      }

      // Seed competition settings if empty
      const settingsCol = db.collection(COLLECTIONS.SETTINGS);
      await settingsCol.updateOne(
        { _id: SETTINGS_DOCS.COMPETITION as unknown as never },
        {
          $setOnInsert: {
            _id: SETTINGS_DOCS.COMPETITION as unknown as never,
            ...DEFAULT_COMPETITION_SETTINGS,
            updatedAt: new Date().toISOString(),
            updatedBy: 'system',
          },
        },
        { upsert: true }
      );
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export async function getCompetitionSettings(): Promise<CompetitionSettings> {
  try {
    await ensureDefaultData();
    const db = await getDatabase();
    const doc = await db.collection(COLLECTIONS.SETTINGS).findOne({
      _id: SETTINGS_DOCS.COMPETITION as unknown as never,
    });

    if (!doc) {
      return DEFAULT_COMPETITION_SETTINGS;
    }

    return {
      submissionsOpen: doc.submissionsOpen ?? true,
      votingOpen: doc.votingOpen ?? true,
      submissionDeadline: doc.submissionDeadline ?? null,
      votingDeadline: doc.votingDeadline ?? null,
      updatedAt: doc.updatedAt ?? null,
      updatedBy: doc.updatedBy ?? '',
    };
  } catch (err) {
    console.warn('Error reading competition settings:', err);
    return DEFAULT_COMPETITION_SETTINGS;
  }
}

export async function updateCompetitionSettings(
  settings: Partial<CompetitionSettings> & { updatedBy?: string }
): Promise<void> {
  await ensureDefaultData();
  const db = await getDatabase();
  await db.collection(COLLECTIONS.SETTINGS).updateOne(
    { _id: SETTINGS_DOCS.COMPETITION as unknown as never },
    {
      $set: {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}



// ─── Voting Logic ─────────────────────────────────────────────────────────────

export class VotingError extends Error {
  readonly code:
    | 'not_authenticated'
    | 'email_not_verified'
    | 'already_voted'
    | 'submission_not_approved'
    | 'category_closed'
    | 'voting_closed'
    | 'unknown';

  constructor(
    code:
      | 'not_authenticated'
      | 'email_not_verified'
      | 'already_voted'
      | 'submission_not_approved'
      | 'category_closed'
      | 'voting_closed'
      | 'unknown',
    message: string
  ) {
    super(message);
    this.code = code;
    this.name = 'VotingError';
  }
}

export function voteDocId(userId: string, categoryId: CategorySlug): string {
  return `${userId}_${categoryId}`;
}

export interface CastVoteParams {
  userId: string;
  userName: string;
  emailVerified: boolean;
  submissionId: string;
  categoryId: CategorySlug;
}

export type VoteActionResult = {
  action: 'voted' | 'revoked' | 'switched';
  previousSubmissionId?: string;
};

export async function castVote({
  userId,
  userName,
  emailVerified,
  submissionId,
  categoryId,
}: CastVoteParams): Promise<VoteActionResult> {
  if (!userId) {
    throw new VotingError('not_authenticated', 'You must be logged in to vote.');
  }
  if (!emailVerified) {
    throw new VotingError('email_not_verified', 'Please verify your email before voting.');
  }

  await ensureDefaultData();
  const db = await getDatabase();

  // 1. Guard: check competition settings
  const settings = await getCompetitionSettings();
  if (!isVotingActive(settings)) {
    throw new VotingError('voting_closed', 'Voting is currently closed for this competition.');
  }

  // 2. Guard: check submission eligibility
  const submission = await db
    .collection(COLLECTIONS.SUBMISSIONS)
    .findOne({ id: submissionId });

  if (!submission || submission.status !== 'approved') {
    throw new VotingError(
      'submission_not_approved',
      'This submission is not eligible for voting.'
    );
  }

  const vId = voteDocId(userId, categoryId);

  // 3. Check if user has already voted in this category
  const existingVote = await db.collection(COLLECTIONS.VOTES).findOne({
    $or: [{ id: vId }, { userId, categoryId }],
  });

  if (existingVote) {
    // If user clicks the SAME submission they already voted for -> REVOKE (unvote)
    if (existingVote.submissionId === submissionId) {
      await db.collection(COLLECTIONS.VOTES).deleteOne({
        $or: [{ id: vId }, { userId, categoryId }],
      });

      // Atomically decrement vote count (prevent negative)
      await db.collection(COLLECTIONS.SUBMISSIONS).updateOne(
        { id: submissionId, voteCount: { $gt: 0 } },
        { $inc: { voteCount: -1 } }
      );

      return { action: 'revoked' };
    }

    // If user clicks a DIFFERENT submission in the same category -> SWITCH vote
    const prevSubId = existingVote.submissionId;

    // Update vote record
    await db.collection(COLLECTIONS.VOTES).updateOne(
      { $or: [{ id: vId }, { userId, categoryId }] },
      {
        $set: {
          submissionId,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Decrement previous submission vote count
    if (prevSubId) {
      await db.collection(COLLECTIONS.SUBMISSIONS).updateOne(
        { id: prevSubId, voteCount: { $gt: 0 } },
        { $inc: { voteCount: -1 } }
      );
    }

    // Increment new submission vote count
    await db.collection(COLLECTIONS.SUBMISSIONS).updateOne(
      { id: submissionId },
      { $inc: { voteCount: 1 } }
    );

    return { action: 'switched', previousSubmissionId: prevSubId };
  }

  // 4. Create new vote record (deterministic ID enforces uniqueness at database engine level)
  try {
    await db.collection(COLLECTIONS.VOTES).insertOne({
      _id: vId as unknown as never,
      id: vId,
      userId,
      userName,
      submissionId,
      categoryId,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 11000) {
      throw new VotingError('already_voted', 'Vote conflict. Please try again.');
    }
    throw err;
  }

  // 5. Atomically increment the vote count on the submission
  await db.collection(COLLECTIONS.SUBMISSIONS).updateOne(
    { id: submissionId },
    {
      $inc: { voteCount: 1 },
    }
  );

  return { action: 'voted' };
}
