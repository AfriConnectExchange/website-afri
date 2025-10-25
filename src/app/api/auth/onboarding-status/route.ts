import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((c) => {
    const [k, ...v] = c.split('=');
    cookies[k?.trim() || ''] = decodeURIComponent((v || []).join('=').trim());
  });
  return cookies;
}

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);

    // NextAuth session cookie names differ by environment. Try both.
    const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'] || cookies['next-auth.token'];
    if (!sessionToken) return NextResponse.json({ authenticated: false }, { status: 200 });

    const session = await prisma.session.findUnique({ where: { sessionToken } });
    if (!session) return NextResponse.json({ authenticated: false }, { status: 200 });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ authenticated: false }, { status: 200 });

    const needsOnboarding = !user.phone || !user.address;

    return NextResponse.json({ authenticated: true, needsOnboarding }, { status: 200 });
  } catch (err: any) {
    console.error('onboarding-status error:', err?.message || err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
