import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { render } from '@react-email/render';
import DeletionRequestEmail from '@/components/emails/deletion-request-template';
import { sendEmail } from '@/lib/email-service';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    // Get user email and display name
    const fbUser = await admin.auth().getUser(uid);
    const email = fbUser.email;
    const displayName = fbUser.displayName ?? null;

    const now = new Date();
    const scheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Mark user doc with scheduled deletion
    const userDocRef = admin.firestore().collection('users').doc(uid);
    await userDocRef.set({ deletion_requested_at: now.toISOString(), deletion_scheduled_at: scheduledAt, deletion_status: 'scheduled' }, { merge: true });

    // Create a lightweight scheduled request doc so admins / tasks can pick it up
    await admin.firestore().collection('deletion_requests').add({ user_id: uid, scheduled_at: scheduledAt, created_at: now.toISOString(), status: 'scheduled' });

    // Render email and send confirmation
    if (email) {
      const html = render(<DeletionRequestEmail userName={displayName ?? undefined} scheduledAt={scheduledAt} />);
      const text = `Your account deletion is scheduled for ${scheduledAt}. If you did not request this, please contact support.`;
      try {
        await sendEmail({ to: email, subject: 'Account deletion scheduled', html, text }, uid);
      } catch (e) {
        console.warn('Failed to send deletion scheduled email', e);
      }
    }

    await logActivity({ user_id: uid, action: 'deletion_requested', changes: { scheduled_at: scheduledAt } });

    return NextResponse.json({ ok: true, scheduled_at: scheduledAt });
  } catch (err: any) {
    console.error('Failed to request deletion:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
