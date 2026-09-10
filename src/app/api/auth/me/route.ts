import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null, role: null });
    }

    // Attempt to read latest profile from MongoDB
    try {
      const db = await getDatabase();
      const userDoc = await db.collection(COLLECTIONS.USERS).findOne({
        $or: [{ uid: session.uid }, { email: session.email }],
      });

      if (userDoc) {
        return NextResponse.json({
          user: {
            uid: userDoc.uid || session.uid,
            name: userDoc.name || session.name,
            email: userDoc.email || session.email,
            role: userDoc.role || session.role,
            emailVerified: userDoc.emailVerified ?? session.emailVerified,
            image: userDoc.image || session.image,
            createdAt: userDoc.createdAt,
          },
          role: userDoc.role || session.role,
        });
      }
    } catch {
      // If DB read temporarily fails, fallback to verified session token
    }

    return NextResponse.json({
      user: {
        uid: session.uid,
        name: session.name,
        email: session.email,
        role: session.role,
        emailVerified: session.emailVerified,
        image: session.image,
      },
      role: session.role,
    });
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return NextResponse.json({ user: null, role: null }, { status: 500 });
  }
}
