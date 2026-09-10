import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS, ensureDefaultData } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { AppUser } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await ensureDefaultData();
    const db = await getDatabase();

    const docs = await db
      .collection(COLLECTIONS.USERS)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const users: AppUser[] = docs.map((d) => ({
      uid: d.uid || d._id.toString(),
      name: d.name,
      email: d.email,
      role: d.role,
      emailVerified: d.emailVerified ?? false,
      image: d.image,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error('Error fetching participants:', err);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}
