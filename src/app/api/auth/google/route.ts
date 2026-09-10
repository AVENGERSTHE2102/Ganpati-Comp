import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error:
          'Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in .env.local',
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const returnUrl = searchParams.get('returnUrl') || '/';

  const redirectUri = `${getAppUrl(request)}/api/auth/google/callback`;

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', returnUrl);

  return NextResponse.redirect(googleAuthUrl.toString());
}
