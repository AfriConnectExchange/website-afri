import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

const bodySchema = z.object({ phone: z.string().min(6), code: z.string().min(4) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: 'Invalid input' }, { status: 400 });

    const { phone, code } = parsed.data;

    const token = await prisma.otpToken.findFirst({
      where: { phone, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) return NextResponse.json({ message: 'No valid OTP found' }, { status: 400 });

    const match = await bcrypt.compare(code, token.tokenHash);
    if (!match) return NextResponse.json({ message: 'Invalid code' }, { status: 400 });

    // Mark token used
    await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });

    // Find or create user by phone
    let user = await prisma.user.findUnique({ where: { phone } as any }).catch(() => null);
    if (!user) {
      // Prisma requires an email field on User. For phone-only accounts we create
      // a synthetic placeholder email to satisfy the schema. This keeps the
      // record unique and avoids changing the schema.
      const sanitized = phone.replace(/\D/g, '') || String(Date.now());
      const placeholderEmail = `phone+${sanitized}@no-email.afri`;

      user = await prisma.user.create({
        data: {
          email: placeholderEmail,
          phone,
          phoneVerified: true,
          status: 'active',
          roles: ['buyer'],
        } as any,
      });
    } else {
      user = await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true, status: 'active' } });
    }

    // Create a NextAuth Session so the user is logged in
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

    // Log activity
    await prisma.activityLog.create({ data: { userId: user.id, action: 'OTP_VERIFIED', entityType: 'otp', entityId: token.id } });

    // Return response with Set-Cookie header via NextResponse
    const res = NextResponse.json({ message: 'Verified', user: { id: user.id, phone: user.phone } }, { status: 200 });
    const cookieOptions: any = {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires,
    };

    res.cookies.set('next-auth.session-token', sessionToken, cookieOptions);
    // also set secure variant for browsers expecting it
    if (cookieOptions.secure) res.cookies.set('__Secure-next-auth.session-token', sessionToken, cookieOptions);

    return res;
  } catch (err: any) {
    console.error('verify-otp error:', err?.message || err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
