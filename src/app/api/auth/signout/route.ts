import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies: Record<string,string> = {};
    cookieHeader.split(';').forEach((c) => {
      const [k, ...v] = c.split('=');
      if (!k) return;
      cookies[k.trim()] = decodeURIComponent((v||[]).join('=').trim());
    });

    const knownNames = ['__Secure-next-auth.session-token', '__Host-next-auth.session-token', 'next-auth.session-token', 'next-auth.token'];
    let token: string | null = null;
    for (const name of knownNames) {
      if (cookies[name]) { token = cookies[name]; break; }
    }
    if (token) {
      try {
        // Remove legacy NextAuth session rows
        await prisma.session.deleteMany({ where: { sessionToken: token } });
      } catch (e) { /* ignore */ }

      try {
        // Remove user_sessions entries that match the token or its hash
        await prisma.userSession.deleteMany({ where: { sessionToken: token } }).catch(() => null);
        const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
        await prisma.userSession.deleteMany({ where: { sessionTokenHash: tokenHash } }).catch(() => null);
      } catch (e) { /* ignore */ }
    }

    const res = NextResponse.json({ ok: true });
    // Clear cookies
    const cookieOptions: any = { path: '/', httpOnly: true };
    res.cookies.set('next-auth.session-token', '', { ...cookieOptions, expires: new Date(0) });
    res.cookies.set('__Secure-next-auth.session-token', '', { ...cookieOptions, expires: new Date(0) });
    res.cookies.set('afri_refresh_token', '', { ...cookieOptions, expires: new Date(0) });
    return res;
  } catch (err: any) {
    console.error('signout error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
