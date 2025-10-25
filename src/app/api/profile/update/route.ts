import { NextRequest, NextResponse } from 'next/server';
import { createTransport } from 'nodemailer';
import { render } from '@react-email/render';
import WelcomeEmail from '@/emails/WelcomeEmail';
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, address, city, country, postcode } = body || {};

    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'] || cookies['next-auth.token'];
    if (!sessionToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

    const session = await prisma.session.findUnique({ where: { sessionToken } });
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    // Load current user to detect onboarding completion
    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        phone: phone ?? undefined,
        address: address ?? undefined,
        city: city ?? undefined,
        country: country ?? undefined,
        postcode: postcode ?? undefined,
      },
    });

    // If the user previously needed onboarding and now has required fields, send welcome email
    const neededBefore = !currentUser?.phone || !currentUser?.address;
    const neededAfter = !updated.phone || !updated.address;

    if (neededBefore && !neededAfter) {
      try {
        const { enqueueEmail } = await import('@/lib/mailer');
        const html = await render(WelcomeEmail({ name: updated.fullName ?? undefined, actionUrl: process.env.NEXTAUTH_URL || 'https://app.africonnect.exchange/onboarding' }));
        await enqueueEmail({ to: updated.email || '', subject: 'Welcome to AfriConnect Exchange', html, templateName: 'WelcomeEmail', userId: updated.id });
      } catch (err: any) {
        console.error('Failed to send welcome email:', err?.message || err);
        await prisma.emailLog.create({
          data: {
            userId: updated.id,
            recipientEmail: updated.email || '',
            senderEmail: process.env.EMAIL_FROM,
            subject: 'Welcome to AfriConnect Exchange',
            templateName: 'WelcomeEmail',
            provider: 'Nodemailer',
            status: 'failed',
            failedAt: new Date(),
            failureReason: err?.message || String(err),
          },
        });
      }
    }

    return NextResponse.json({ message: 'Profile updated', user: { id: updated.id, phone: updated.phone, address: updated.address } }, { status: 200 });
  } catch (err: any) {
    console.error('profile update error:', err?.message || err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
