import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  COLLECTIONS,
  ensureDefaultData,
  getCompetitionSettings,
  isSubmissionsActive,
} from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { CategorySlug, FileType, Submission } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await ensureDefaultData();
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const participantId = searchParams.get('participantId');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    const filter: Record<string, unknown> = {};

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (participantId) {
      filter.participantId = participantId;
      if (status && status !== 'all') {
        filter.status = status;
      }
    } else if (status) {
      if (status !== 'all') {
        filter.status = status;
      }
    } else {
      // By default, public gallery only shows approved submissions
      filter.status = 'approved';
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { participantName: { $regex: q, $options: 'i' } },
      ];
    }

    const sortOptions: Record<string, 1 | -1> =
      sort === 'votes' ? { voteCount: -1, createdAt: -1 } : { createdAt: -1 };

    const docs = await db
      .collection(COLLECTIONS.SUBMISSIONS)
      .find(filter)
      .sort(sortOptions)
      .toArray();

    const submissions: Submission[] = docs.map((d) => ({
      id: d.id || d._id.toString(),
      participantId: d.participantId,
      participantName: d.participantName,
      categoryId: d.categoryId as CategorySlug,
      title: d.title,
      description: d.description,
      fileUrl: d.fileUrl,
      fileType: d.fileType as FileType,
      status: d.status,
      voteCount: d.voteCount || 0,
      createdAt: d.createdAt,
      approvedAt: d.approvedAt ?? null,
    }));

    return NextResponse.json({ submissions });
  } catch (err) {
    console.error('Error in GET /api/submissions:', err);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to submit an entry.' },
        { status: 401 }
      );
    }

    await ensureDefaultData();
    const settings = await getCompetitionSettings();
    if (!isSubmissionsActive(settings)) {
      return NextResponse.json(
        { error: 'Submissions are currently closed for this competition.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categoryId, title, description, fileUrl, fileType } = body;

    if (!categoryId || !title?.trim() || !description?.trim() || !fileUrl) {
      return NextResponse.json(
        { error: 'Please provide all required fields.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const submissionId = randomUUID();

    const newSubmission: Submission = {
      id: submissionId,
      participantId: session.uid,
      participantName: session.name || session.email.split('@')[0],
      categoryId: categoryId as CategorySlug,
      title: title.trim(),
      description: description.trim(),
      fileUrl,
      fileType: fileType || 'other',
      status: 'pending',
      voteCount: 0,
      createdAt: new Date().toISOString(),
      approvedAt: null,
    };

    await db.collection(COLLECTIONS.SUBMISSIONS).insertOne({
      _id: submissionId as unknown as never,
      ...newSubmission,
    });

    return NextResponse.json({ success: true, submission: newSubmission });
  } catch (err) {
    console.error('Error in POST /api/submissions:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to submit entry' },
      { status: 500 }
    );
  }
}
