
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createTransport } from 'nodemailer';
import { render } from '@react-email/render';
import VerificationEmail from '@/emails/VerificationEmail';
import prisma from '@/lib/prisma';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validatedData.error.errors }, { status: 400 });
    }

    const { name, email, password } = validatedData.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createData = {
      fullName: name,
      email,
      passwordHash,
      // ensure defaults explicitly
      status: 'pending',
      verificationStatus: 'unverified',
      // emailVerified is now a timestamp (DateTime?) - omitted so DB will store NULL
    } as any;

    // Debug: log payload before sending to Prisma to help diagnose connector errors
    console.debug('Creating user with data:', JSON.stringify(createData));

    // Diagnostic: make a simple query to verify DB connectivity/protocol before attempting create
    try {
      const ping = await prisma.$queryRaw`SELECT 1 as result`;
      console.debug('Prisma ping result:', ping);
      try {
        const version = await prisma.$queryRaw`SELECT version() as ver`;
        console.debug('Postgres version:', version);
      } catch (verErr) {
        console.debug('Could not fetch Postgres version:', verErr);
      }
    } catch (pingErr) {
      console.error('Prisma ping failed:', pingErr);
    }

    let user;
    try {
      user = await prisma.user.create({ data: createData });
    } catch (e: any) {
      console.error('Prisma create failed, attempting minimal create to isolate issue', e?.message || e);
      try {
        // Try a minimal create with only required fields to see if a specific field/value causes the error
        user = await prisma.user.create({ data: { fullName: name, email, passwordHash } as any });
        console.warn('Minimal user create succeeded; original createData may contain problematic fields');
      } catch (e2: any) {
        console.error('Minimal create also failed:', e2?.message || e2);
        throw e; // rethrow original
      }
    }

    // Create verification token (valid 24 hours)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store hashed token for security
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: tokenHash,
        expires,
      },
    });

    // Send verification email
    try {
      const transport = createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

  // Point the user to the client-side verify page which will show a verifying
  // UI while the server-side `/api/auth/verify` endpoint performs the actual
  // token validation. This allows a cleaner UX: "Verifying..." -> "Verified".
  const verifyLink = `${process.env.NEXTAUTH_URL?.replace(/\/$/, '') || ''}/auth/verify-email?token=${token}`;
  const html = await render(VerificationEmail({ link: verifyLink, name: user.fullName || name }));

      const { enqueueEmail } = await import('@/lib/mailer');
      await enqueueEmail({ to: email, subject: 'Verify your email for AfriConnect Exchange', html, templateName: 'VerificationEmail', userId: user.id });
    } catch (err: any) {
      console.error('Failed to send verification email:', err?.message || err);
      // Log failure but continue
      await prisma.emailLog.create({
        data: {
          userId: user.id,
          recipientEmail: email,
          senderEmail: process.env.EMAIL_FROM,
          subject: 'Verify your email for AfriConnect Exchange',
          templateName: 'VerificationEmail',
          provider: 'Nodemailer',
          status: 'failed',
          failedAt: new Date(),
          failureReason: err?.message || String(err),
        },
      });
    }

    return NextResponse.json({ message: 'User created successfully. Check email to verify account.' }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
