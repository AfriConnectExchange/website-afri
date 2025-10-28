import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Email required.' }, { status: 400 });
  }

  try {
    // Generate verification link
    const link = await admin.auth().generateEmailVerificationLink(email);

    // Send verification email via our email service
    const subject = 'Verify your email for AfriConnect';
    const text = `Please verify your email by visiting: ${link}`;
    const html = `<p>Please verify your email by <a href="${link}">clicking here</a>.</p>`;
    await sendEmail({ to: email, subject, text, html });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to resend verification' }, { status: 400 });
  }
}
