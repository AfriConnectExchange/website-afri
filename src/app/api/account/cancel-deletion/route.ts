import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { render } from '@react-email/render';
import DeletionCancelEmail from '@/components/emails/deletion-cancel-template';
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

    const fbUser = await admin.auth().getUser(uid);
    const email = fbUser.email;
    const displayName = fbUser.displayName ?? null;

    // Clear deletion fields
    const userDocRef = admin.firestore().collection('users').doc(uid);
    await userDocRef.set({ deletion_requested_at: admin.firestore.FieldValue.delete(), deletion_scheduled_at: admin.firestore.FieldValue.delete(), deletion_status: admin.firestore.FieldValue.delete() }, { merge: true });

    // Update any pending deletion_requests docs for this user
    const q = await admin.firestore().collection('deletion_requests').where('user_id', '==', uid).where('status', '==', 'scheduled').get();
    const batch = admin.firestore().batch();
    q.forEach(d => batch.update(d.ref, { status: 'cancelled', cancelled_at: new Date().toISOString() }));
    await batch.commit();

    // Send cancellation email
    if (email) {
      const html = render(<DeletionCancelEmail userName={displayName ?? undefined} />);
      const text = `Your account deletion request has been cancelled. Your account will remain active.`;
      try {
        await sendEmail({ to: email, subject: 'Account deletion cancelled', html, text }, uid);
      } catch (e) {
        console.warn('Failed to send deletion cancellation email', e);
      }
    }

    await logActivity({ user_id: uid, action: 'deletion_cancelled' });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to cancel deletion:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
