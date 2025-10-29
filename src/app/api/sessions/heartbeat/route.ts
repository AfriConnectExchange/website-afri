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

    await sessionRef.update({ last_seen_at: new Date().toISOString(), is_active: true });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to heartbeat session:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
