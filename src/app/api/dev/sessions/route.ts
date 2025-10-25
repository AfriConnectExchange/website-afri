import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Dev-only: list recent NextAuth sessions to help debug missing cookies
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  try {
    const sessions = await prisma.session.findMany({ orderBy: { expires: 'desc' }, take: 20 });
    const out = sessions.map((s) => ({ id: s.id, userId: s.userId, sessionTokenPreview: s.sessionToken?.slice(0, 12) + '...', expires: s.expires }));
    return NextResponse.json({ count: out.length, sessions: out }, { status: 200 });
  } catch (err) {
    console.error('Dev /api/dev/sessions error:', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
