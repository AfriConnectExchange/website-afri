import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import twilio from 'twilio';

const bodySchema = z.object({ phone: z.string().min(6) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: 'Invalid phone' }, { status: 400 });

    const { phone } = parsed.data;

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused tokens for this phone
    await prisma.otpToken.updateMany({ where: { phone, used: false }, data: { used: true } }).catch(() => {});

    const otp = await prisma.otpToken.create({
      data: { phone, tokenHash, expiresAt },
    });

    // Try sending SMS via Twilio if configured
    let sent = false;
    let providerMessageId: string | null = null;
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM_NUMBER;
      if (sid && token && from) {
        const client = twilio(sid, token);
        const msg = await client.messages.create({
          body: `Your AfriConnect verification code is ${code}`,
          from,
          to: phone,
        });
        sent = true;
        providerMessageId = (msg as any).sid || null;
      }
    } catch (err: any) {
      console.error('Twilio send error:', err?.message || err);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'OTP_SENT',
        entityType: 'otp',
        entityId: otp.id,
        changes: { phone, sent },
      },
    });

    // For development convenience only, include the code in response when not in production
    const isDev = process.env.NODE_ENV !== 'production';
    const response: any = { message: 'OTP created' };
    if (isDev && !sent) response.code = code;
    if (sent) response.providerMessageId = providerMessageId;

    return NextResponse.json(response, { status: 201 });
  } catch (err: any) {
    console.error('send-otp error:', err?.message || err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
