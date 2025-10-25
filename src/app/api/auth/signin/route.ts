import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Credentials signin creating a UserSession row and setting httpOnly cookies.
 * Creates both a session token and a refresh token. Tokens are stored hashed
 * in the DB (sessionTokenHash / refreshTokenHash) while a sessionToken field
 * is also set for compatibility with existing lookups.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'No user found' }, { status: 401 });

    if (!user.emailVerified) return NextResponse.json({ error: 'Please verify your email before signing in.' }, { status: 403 });

    if (!user.passwordHash) return NextResponse.json({ error: 'Password not set' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

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

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.fullName } });

    const accessCookieOpts: any = {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: accessExpires,
    };

    const refreshCookieOpts: any = {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: refreshExpires,
    };

    // For compatibility with existing client code, set NextAuth-style cookie names
    res.cookies.set('next-auth.session-token', sessionToken, accessCookieOpts);
    if (accessCookieOpts.secure) res.cookies.set('__Secure-next-auth.session-token', sessionToken, accessCookieOpts);

    // Also set a refresh cookie
    res.cookies.set('afri_refresh_token', refreshToken, refreshCookieOpts);

    return res;
  } catch (err: any) {
    console.error('signin error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
