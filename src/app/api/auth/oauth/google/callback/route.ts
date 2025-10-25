import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { signAccessToken } from '@/lib/jwt';

function parseCookies(req: NextRequest) {
  const header = req.headers.get('cookie') || '';
  const cookies: Record<string, string> = {};
  header.split(';').forEach((c) => {
    const [k, ...v] = c.split('=');
    if (!k) return;
    cookies[k.trim()] = decodeURIComponent((v || []).join('=').trim());
  });
  return cookies;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const cookies = parseCookies(req);
    const savedState = cookies['oauth_state'];

    if (!code || !state || !savedState || state !== savedState) {
      return NextResponse.json({ error: 'Invalid OAuth state or missing code' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL}/api/auth/oauth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenJson = await tokenResp.json();
    if (!tokenJson || !tokenJson.access_token) {
      console.error('google token error', tokenJson);
      return NextResponse.json({ error: 'Failed to exchange code' }, { status: 400 });
    }

    // Fetch profile
    const profileResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const profile = await profileResp.json();
    if (!profile || !profile.email) return NextResponse.json({ error: 'No email from provider' }, { status: 400 });

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      user = await prisma.user.create({
        // cast data as any to avoid mismatches with generated Prisma types in this repo
        data: ({
          email: profile.email,
          emailVerified: (new Date() as any),
          name: profile.name || profile.email.split('@')[0],
        } as any),
      });
    }

    // Create or update social auth record
    const existing = await prisma.socialAuth.findFirst({ where: { provider: 'google', providerUserId: profile.id } });
    if (!existing) {
      await prisma.socialAuth.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerUserId: profile.id,
          accessToken: tokenJson.access_token,
          refreshToken: tokenJson.refresh_token,
          tokenExpiresAt: tokenJson.expires_in ? new Date(Date.now() + tokenJson.expires_in * 1000) : null,
          profileData: profile,
        },
      });
    } else {
      await prisma.socialAuth.update({
        where: { id: existing.id },
        data: {
          accessToken: tokenJson.access_token,
          refreshToken: tokenJson.refresh_token,
          tokenExpiresAt: tokenJson.expires_in ? new Date(Date.now() + tokenJson.expires_in * 1000) : undefined,
          profileData: profile,
        },
      });
    }

    // create session tokens
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const accessExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const userSession = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        sessionTokenHash,
        refreshToken,
        refreshTokenHash,
        expiresAt: refreshExpires,
        lastActivityAt: new Date(),
      },
    });

    // issue access JWT
    const accessToken = await signAccessToken({ sub: user.id, sid: userSession.id }, 60 * 15);

    const res = NextResponse.redirect(process.env.NEXT_PUBLIC_AFTER_OAUTH || '/');
    const secure = process.env.NODE_ENV === 'production';
    const accessCookieOpts: any = { httpOnly: true, path: '/', sameSite: 'lax', secure, expires: accessExpires };
    const refreshCookieOpts: any = { httpOnly: true, path: '/', sameSite: 'lax', secure, expires: refreshExpires };

    // set cookies
    res.cookies.set('next-auth.session-token', sessionToken, accessCookieOpts);
    if (secure) res.cookies.set('__Secure-next-auth.session-token', sessionToken, accessCookieOpts);
    res.cookies.set('afri_refresh_token', refreshToken, refreshCookieOpts);
    res.cookies.set('afri_access_token', accessToken, { httpOnly: true, path: '/', sameSite: 'lax', secure, expires: new Date(Date.now() + 15 * 60 * 1000) });

    // clear oauth_state cookie
    res.cookies.set('oauth_state', '', { path: '/', maxAge: 0 });

    return res;
  } catch (err) {
    console.error('oauth callback error', err);
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
  }
}

export default GET;
