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

    // Soft-mark the user in Firestore
    try {
      await admin.firestore().collection('users').doc(uid).set({ deactivated: true, deactivated_at: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Failed to mark user doc deactivated:', e);
    }

    // Disable the Firebase Auth user so they cannot sign in
    try {
      await admin.auth().updateUser(uid, { disabled: true });
      // Revoke refresh tokens to force sign-out across devices
      await admin.auth().revokeRefreshTokens(uid);
    } catch (e) {
      console.warn('Failed to disable auth user or revoke tokens:', e);
    }

    await logActivity({ user_id: uid, action: 'account_deactivated' });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to deactivate account:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
