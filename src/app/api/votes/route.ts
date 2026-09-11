import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS, castVote, VotingError, ensureDefaultData } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Vote } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    await ensureDefaultData();
    const db = await getDatabase();

    // Mode: return current user's voting history (votedCategories & votedSubmissions map)
    if (mode === 'user' || (!mode && session?.role !== 'admin')) {
      if (!session) {
        return NextResponse.json({
          votedCategories: [],
          votedSubmissions: {},
        });
      }

      const userVotes = await db
        .collection(COLLECTIONS.VOTES)
        .find({ userId: session.uid })
        .toArray();

      const votedCategories: string[] = [];
      const votedSubmissions: Record<string, string> = {};

      for (const v of userVotes) {
        votedCategories.push(v.categoryId);
        votedSubmissions[v.categoryId] = v.submissionId;
      }

      return NextResponse.json({
        votedCategories,
        votedSubmissions,
      });
    }

    // Admin audit log
    if (session?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const docs = await db
      .collection(COLLECTIONS.VOTES)
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    const votes: Vote[] = docs.map((d) => ({
      id: d.id || d._id.toString(),
      userId: d.userId,
      userName: d.userName,
      submissionId: d.submissionId,
      categoryId: d.categoryId,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ votes });
  } catch (err) {
    console.error('Error in GET /api/votes:', err);
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to vote.', code: 'not_authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { submissionId, categoryId } = body;

    if (!submissionId || !categoryId) {
      return NextResponse.json(
        { error: 'Submission ID and Category ID are required.' },
        { status: 400 }
      );
    }

    const result = await castVote({
      userId: session.uid,
      userName: session.name || session.email.split('@')[0],
      emailVerified: session.emailVerified,
      submissionId,
      categoryId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof VotingError) {
      const statusMap: Record<string, number> = {
        not_authenticated: 401,
        email_not_verified: 403,
        already_voted: 409,
        submission_not_approved: 400,
        voting_closed: 403,
      };
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: statusMap[err.code] || 400 }
      );
    }

    console.error('Error casting vote:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to cast vote.' },
      { status: 500 }
    );
  }
}
