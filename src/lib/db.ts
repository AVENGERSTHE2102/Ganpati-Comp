import { getDatabase } from '@/lib/mongodb';
import type {
  Category,
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

export const CATEGORY_SEEDS: Omit<Category, 'createdAt'>[] = [
  {
    id: 'home-decor',
    name: 'Home Decor',
    slug: 'home-decor',
    description:
      'Showcase your beautiful and eco-friendly Ganpati makhar and home decorations.',
    isOpen: true,
  },
  {
    id: 'reel-making',
    name: 'Reel Making',
    slug: 'reel-making',
    description:
      'Capture the festive spirit through creative short videos and reels.',
    isOpen: true,
  },
  {
    id: 'literature',
    name: 'Literature',
    slug: 'literature',
    description:
      'Express your devotion through essays, poems, and stories about Lord Ganesha.',
    isOpen: true,
  },
  {
    id: 'faculty-corner',
    name: 'Faculty Corner',
    slug: 'faculty-corner',
    description:
      'A special category for our esteemed faculty to share their festive joy.',
    isOpen: true,
  },
];

export const DEFAULT_COMPETITION_SETTINGS: CompetitionSettings = {
  submissionsOpen: true,
  votingOpen: true,
  submissionDeadline: null,
  votingDeadline: null,
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

export function isSubmissionsActive(settings: CompetitionSettings | null): boolean {
  if (!settings) return true;
  if (!settings.submissionsOpen) return false;
  if (settings.submissionDeadline) {
    const deadlineTime = new Date(settings.submissionDeadline as string | Date).getTime();
    return deadlineTime > Date.now();
  }
  return true;
}

export function isVotingActive(settings: CompetitionSettings | null): boolean {
  if (!settings) return true;
  if (!settings.votingOpen) return false;
  if (settings.votingDeadline) {
    const deadlineTime = new Date(settings.votingDeadline as string | Date).getTime();
    return deadlineTime > Date.now();
  }
  return true;
}

// ─── Voting Logic ─────────────────────────────────────────────────────────────

export class VotingError extends Error {
  constructor(
    public readonly code:
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

export async function castVote({
  userId,
  userName,
  emailVerified,
  submissionId,
  categoryId,
}: CastVoteParams): Promise<void> {
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

  // 3. Guard: check if already voted
  const existingVote = await db.collection(COLLECTIONS.VOTES).findOne({
    $or: [{ id: vId }, { userId, categoryId }],
  });

  if (existingVote) {
    throw new VotingError('already_voted', 'You have already voted in this category.');
  }

  // 4. Create vote record (deterministic ID enforces uniqueness at database engine level)
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
      throw new VotingError('already_voted', 'You have already voted in this category.');
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
}
