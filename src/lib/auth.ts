import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/types';

export const SESSION_COOKIE_NAME = 'marathi_session_token';
const DEFAULT_SECRET = 'marathi-club-session-secret-key-32-chars-min!';

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  image?: string;
  exp?: number;
}

/**
 * Creates and signs a JWT session token for the user.
 */
export async function createSessionToken(user: {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  image?: string;
}): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    image: user.image,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

/**
 * Verifies a JWT session token.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Reads the current session from incoming request cookies.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Sets the session cookie on the response.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Helper to determine the application base URL for OAuth callbacks.
 * Dynamically resolves from incoming request headers (x-forwarded-host, host)
 * so it automatically works on localhost, Vercel deployments, and custom domains
 * without hardcoding localhost:3000 in production.
 */
export function getAppUrl(request?: Request): string {
  if (request) {
    const rawHost =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host');

    if (rawHost) {
      const host = rawHost.split(',')[0].trim();
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      const rawProto = request.headers.get('x-forwarded-proto');
      const proto = rawProto
        ? rawProto.split(',')[0].trim()
        : (isLocal ? 'http' : 'https');
      return `${proto}://${host}`;
    }
  }

  // Fallback: If running on Vercel without a request object
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Explicit environment variable if configured (and not localhost in production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    if (process.env.NODE_ENV !== 'production' || !appUrl.includes('localhost')) {
      return appUrl;
    }
  }

  return 'http://localhost:3000';
}
