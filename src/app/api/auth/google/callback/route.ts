import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl, createSessionToken, setSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS, ensureDefaultData } from '@/lib/db';
import { isAdminEmail } from '@/lib/adminConfig';
import type { UserRole } from '@/lib/types';

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/';
  const error = searchParams.get('error');

  const appUrl = getAppUrl(request);

  if (error) {
    console.error('Google OAuth error returned:', error);
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent('Google sign in was cancelled or failed.')}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent('No authorization code returned from Google.')}`
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Google Client ID or Secret missing in environment.');
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent('Google OAuth credentials not configured on server.')}`
    );
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to exchange code with Google:', tokenData);
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent('Failed to exchange authentication code with Google.')}`
      );
    }

    // 2. Fetch user information
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userinfoResponse.ok) {
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent('Failed to fetch user profile from Google.')}`
      );
    }

    const googleUser: GoogleUserInfo = await userinfoResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent('No email address provided by Google account.')}`
      );
    }

    // 3. Connect to MongoDB and upsert user record
    const email = googleUser.email.toLowerCase().trim();
    const isUserAdmin = isAdminEmail(email);
    const assignedRole: UserRole = isUserAdmin ? 'admin' : 'participant';

    let userDoc;
    try {
      await ensureDefaultData();
      const db = await getDatabase();
      const usersCol = db.collection(COLLECTIONS.USERS);

      userDoc = await usersCol.findOne({ email });

      if (!userDoc) {
        // New user
        userDoc = {
          _id: googleUser.sub as unknown as never,
          uid: googleUser.sub,
          email,
          name: googleUser.name || email.split('@')[0],
          role: assignedRole,
          emailVerified: true, // Google OAuth confirms email verification
          image: googleUser.picture || '',
          createdAt: new Date().toISOString(),
        };
        await usersCol.insertOne(userDoc);
      } else {
        // Returning user: sync profile data & ensure admin status
        const updates: Record<string, unknown> = {
          emailVerified: true,
        };
        if (googleUser.name && !userDoc.name) {
          updates.name = googleUser.name;
        }
        if (googleUser.picture) {
          updates.image = googleUser.picture;
        }
        if (isUserAdmin && userDoc.role !== 'admin') {
          updates.role = 'admin';
          userDoc.role = 'admin';
        }
        await usersCol.updateOne({ email }, { $set: updates });
      }
    } catch (dbErr: unknown) {
      const errorObj = dbErr as Error;
      console.error('Database error in Google OAuth callback:', errorObj);
      const isSslOrNetwork =
        errorObj?.message?.includes('SSL') ||
        errorObj?.message?.includes('tlsv1') ||
        errorObj?.name?.includes('MongoServerSelectionError') ||
        errorObj?.name?.includes('MongoNetworkError');
      const friendlyMessage = isSslOrNetwork
        ? 'Database connection failed. Please ensure your IP address is whitelisted in MongoDB Atlas Network Access.'
        : `Database error: ${errorObj?.message || 'Failed to save user profile.'}`;
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent(friendlyMessage)}`
      );
    }

    // 4. Create and set session cookie
    const token = await createSessionToken({
      uid: userDoc.uid || googleUser.sub,
      email: userDoc.email,
      name: userDoc.name || email.split('@')[0],
      role: (userDoc.role as UserRole) || assignedRole,
      emailVerified: true,
      image: userDoc.image || googleUser.picture || '',
    });

    await setSessionCookie(token);

    // 5. Determine redirection destination
    let destination = state && state.startsWith('/') ? state : '/dashboard';

    // If destination was login or root, redirect admins to /admin, others to /dashboard
    if (destination === '/' || destination === '/login' || destination === '/register') {
      destination = userDoc.role === 'admin' ? '/admin' : '/dashboard';
    }

    const response = NextResponse.redirect(`${appUrl}${destination}`);
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error('Google OAuth callback error:', errorObj);
    const detail = errorObj?.message ? `: ${errorObj.message}` : '';
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent(`An unexpected error occurred during Google sign in${detail}`)}`
    );
  }
}
