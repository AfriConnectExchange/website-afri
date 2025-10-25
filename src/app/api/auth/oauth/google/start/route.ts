import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export async function GET(req: NextRequest) {
  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL}/api/auth/oauth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const redirect = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  const res = NextResponse.redirect(redirect);
  const secure = process.env.NODE_ENV === 'production';
  res.cookies.set('oauth_state', state, { httpOnly: true, path: '/', sameSite: 'lax', secure, maxAge: 60 * 5 });
  return res;
}

export default GET;
