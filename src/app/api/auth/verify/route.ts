import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) return NextResponse.json({ message: 'Missing token' }, { status: 400 });

  // tokens are stored hashed (sha256). Hash incoming token before lookup.
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });
    if (!record) return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });

    if (record.expires < new Date()) {
      // token expired
      await prisma.verificationToken.deleteMany({ where: { token: tokenHash } }).catch(() => {});
      return NextResponse.json({ message: 'Token expired' }, { status: 400 });
    }

    // Activate the user (store verification timestamp)
    await prisma.user.update({
      where: { email: record.identifier },
      // cast to any to avoid TypeScript mismatch until Prisma client is regenerated
      data: { emailVerified: (new Date() as any), status: 'active' },
    });

    // Remove token
    await prisma.verificationToken.delete({ where: { token: tokenHash } });

    // Redirect to a friendly verification success page
    const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || '';
    const redirectUrl = `${base}/auth/verify-email?status=success`;
    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('Verification error:', err?.message || err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
