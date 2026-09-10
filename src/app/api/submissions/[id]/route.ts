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
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const db = await getDatabase();
    const updates: Record<string, unknown> = {
      status,
    };

    if (status === 'approved') {
      updates.approvedAt = new Date().toISOString();
    } else {
      updates.approvedAt = null;
    }

    const result = await db.collection(COLLECTIONS.SUBMISSIONS).updateOne(
      { $or: [{ id }, { _id: id as unknown as never }] },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, status });
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
