import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const sessionId = body.session_id;
    const revokeAll = !!body.revoke_all;

    if (revokeAll) {
      // Mark all sessions inactive for user
      const q = await admin.firestore().collection('user_sessions').where('user_id', '==', uid).get();
      const batch = admin.firestore().batch();
      q.forEach(docSnap => batch.update(docSnap.ref, { is_active: false, revoked_at: new Date().toISOString() }));
      await batch.commit();
      // Optionally revoke refresh tokens to force sign-out across devices
      try {
        await admin.auth().revokeRefreshTokens(uid);
      } catch (e) {
        console.warn('Failed to revoke refresh tokens:', e);
      }
      return NextResponse.json({ ok: true });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const sessionRef = admin.firestore().collection('user_sessions').doc(sessionId);
    const snap = await sessionRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const data = snap.data();
    if (data?.user_id !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await sessionRef.update({ is_active: false, revoked_at: new Date().toISOString() });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to revoke session:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
