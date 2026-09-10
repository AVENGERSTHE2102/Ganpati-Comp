import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS, ensureDefaultData } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await ensureDefaultData();
    const db = await getDatabase();

    const [
      totalParticipants,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      totalVotes,
    ] = await Promise.all([
      db.collection(COLLECTIONS.USERS).countDocuments({}),
      db.collection(COLLECTIONS.SUBMISSIONS).countDocuments({}),
      db.collection(COLLECTIONS.SUBMISSIONS).countDocuments({ status: 'pending' }),
      db.collection(COLLECTIONS.SUBMISSIONS).countDocuments({ status: 'approved' }),
      db.collection(COLLECTIONS.VOTES).countDocuments({}),
    ]);

    return NextResponse.json({
      stats: {
        totalParticipants,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        totalVotes,
      },
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
