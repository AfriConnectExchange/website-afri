import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { render } from '@react-email/render';
import { sendEmail } from '@/lib/email-service';
import { ReactivationRequestEmail } from '@/components/emails/reactivation-request-template';
import { AdminReactivationNotifyEmail } from '@/components/emails/reactivation-admin-template';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email;
    const message = body.message ?? '';
    if (!email) return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });

    const now = new Date().toISOString();
    await admin.firestore().collection('reactivation_requests').add({ email, message, created_at: now, status: 'pending' });

    // Send ack to user
    try {
      const html = render(<ReactivationRequestEmail userEmail={email} />);
      const text = `We received your reactivation request. Our team will review it and get back to you.`;
      await sendEmail({ to: email, subject: 'We received your reactivation request', html, text });
    } catch (e) {
      console.warn('Failed to send ack email to user', e);
    }

    // Notify admins if configured
    try {
      const adminEmail = process.env.SUPPORT_EMAIL;
      if (adminEmail) {
        const adminHtml = render(<AdminReactivationNotifyEmail userEmail={email} message={message} />);
        const adminText = `Reactivation request for ${email}: ${message}`;
        await sendEmail({ to: adminEmail, subject: `Reactivation request: ${email}`, html: adminHtml, text: adminText });
      }
    } catch (e) {
      console.warn('Failed to notify admin of reactivation request', e);
    }

    await logActivity({ user_id: email, action: 'reactivation_requested', changes: { message } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to create reactivation request', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
