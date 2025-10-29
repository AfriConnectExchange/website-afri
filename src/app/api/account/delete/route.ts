import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
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

    // Log the deletion initiation
    await logActivity({ user_id: uid, action: 'account_deletion_initiated' });

    const userDocRef = admin.firestore().collection('users').doc(uid);
    try {
      // Mark the user doc as deleted (soft-delete) first
      await userDocRef.set({ deleted: true, deleted_at: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Failed to mark user doc deleted:', e);
    }

    // Attempt to delete the Auth user (destructive). This will permanently remove the user.
    try {
      await admin.auth().deleteUser(uid);
    } catch (e) {
      console.warn('Failed to delete auth user:', e);
    }

    // Final activity log
    await logActivity({ user_id: uid, action: 'account_deleted' });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to delete account:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
