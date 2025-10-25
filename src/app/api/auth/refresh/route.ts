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

export async function POST(req: NextRequest) {
  try {
    const cookies = parseCookies(req);
    const refreshToken = cookies['afri_refresh_token'];
    if (!refreshToken) return NextResponse.json({ error: 'No refresh token' }, { status: 401 });

    // Try to find session by raw token first
    const sessionByRaw = await prisma.userSession.findFirst({ where: { refreshToken } }).catch(() => null);
    let session = sessionByRaw;

    // If not found by raw token, try hashed lookup
    if (!session) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const sessionByHash = await prisma.userSession.findFirst({ where: { refreshTokenHash: hash } }).catch(() => null);

      // Reuse detection: if a session matches by hash but not by raw token, treat as possible token reuse.
      if (sessionByHash && !sessionByRaw) {
        // Revoke the session and require re-login
        await prisma.userSession.update({ where: { id: sessionByHash.id }, data: { revokedAt: new Date(), isActive: false } }).catch(() => null);
        return NextResponse.json({ error: 'Refresh token reuse detected. Session revoked.' }, { status: 403 });
      }

      session = sessionByHash;
    }

    if (!session) return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });

    // Check expiry & revoked
    if (session.revokedAt || !session.isActive) return NextResponse.json({ error: 'Session revoked' }, { status: 403 });
    if (new Date(session.expiresAt) < new Date()) return NextResponse.json({ error: 'Refresh token expired' }, { status: 401 });

    // Rotate refresh token
    const newRefreshToken = crypto.randomBytes(48).toString('hex');
    const newRefreshHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        refreshTokenHash: newRefreshHash,
        expiresAt: newExpires,
        lastActivityAt: new Date(),
        isActive: true,
      },
    });

    // Issue a short-lived access JWT
    const accessToken = await signAccessToken({ sub: session.userId, sid: session.id }, 60 * 15);

    const res = NextResponse.json({ ok: true, accessToken, userId: session.userId });

    const secure = process.env.NODE_ENV === 'production';
    const refreshCookieOpts: any = { httpOnly: true, path: '/', sameSite: 'lax', secure, expires: newExpires };
    const accessCookieOpts: any = { httpOnly: true, path: '/', sameSite: 'lax', secure, expires: new Date(Date.now() + 15 * 60 * 1000) };

    // Keep legacy session-token cookie in place (if sessionToken exists)
    if (updated.sessionToken) {
      res.cookies.set('next-auth.session-token', updated.sessionToken, accessCookieOpts);
      if (secure) res.cookies.set('__Secure-next-auth.session-token', updated.sessionToken, accessCookieOpts);
    }

    // Set rotated refresh cookie
    res.cookies.set('afri_refresh_token', newRefreshToken, refreshCookieOpts);

    // Also set an httpOnly access JWT cookie (optional, for server-side APIs that prefer JWT)
    res.cookies.set('afri_access_token', accessToken, accessCookieOpts);

    return res;
  } catch (err) {
    console.error('refresh error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export default POST;
