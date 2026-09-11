import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = await getDatabase();
    const doc = await db.collection(COLLECTIONS.SUBMISSIONS).findOne({
      $or: [{ id }, { _id: id as unknown as never }],
    });

    if (!doc) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission: { id: doc.id || doc._id.toString(), ...doc } });
  } catch (err) {
    console.error('Error fetching submission:', err);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await context.params;
    const db = await getDatabase();
    const doc = await db.collection(COLLECTIONS.SUBMISSIONS).findOne({
      $or: [{ id }, { _id: id as unknown as never }],
    });

    if (!doc) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const isOwner = session.uid === doc.participantId;
    const isAdmin = session.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this submission.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Submitter or Admin can update Title
    if (typeof body.title === 'string') {
      const trimmedTitle = body.title.trim();
      if (trimmedTitle.length < 3) {
        return NextResponse.json({ error: 'Title must be at least 3 characters.' }, { status: 400 });
      }
      updates.title = trimmedTitle;
    }

    // Submitter or Admin can update Description
    if (typeof body.description === 'string') {
      const trimmedDesc = body.description.trim();
      if (trimmedDesc.length < 10) {
        return NextResponse.json({ error: 'Description must be at least 10 characters.' }, { status: 400 });
      }
      updates.description = trimmedDesc;
    }

    // Submitter or Admin can update Category
    if (typeof body.categoryId === 'string') {
      const validCategories = ['home-decor', 'reel-making', 'literature', 'faculty-corner'];
      if (!validCategories.includes(body.categoryId)) {
        return NextResponse.json({ error: 'Invalid category specified.' }, { status: 400 });
      }
      updates.categoryId = body.categoryId;
    }

    // Only Admin can update Status
    if (body.status !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Only admins can update submission status.' }, { status: 403 });
      }
      if (!['approved', 'rejected', 'pending'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      updates.status = body.status;
      updates.approvedAt = body.status === 'approved' ? new Date().toISOString() : null;
    }

    await db.collection(COLLECTIONS.SUBMISSIONS).updateOne(
      { $or: [{ id }, { _id: id as unknown as never }] },
      { $set: updates }
    );

    const updatedDoc = {
      ...doc,
      ...updates,
      id: doc.id || doc._id.toString(),
    };

    return NextResponse.json({ success: true, submission: updatedDoc });
  } catch (err) {
    console.error('Error updating submission:', err);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await context.params;
    const db = await getDatabase();

    const result = await db.collection(COLLECTIONS.SUBMISSIONS).deleteOne({
      $or: [{ id }, { _id: id as unknown as never }],
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Also clean up any votes associated with this submission
    await db.collection(COLLECTIONS.VOTES).deleteMany({ submissionId: id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting submission:', err);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
