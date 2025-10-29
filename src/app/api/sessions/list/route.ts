import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const q = await admin.firestore().collection('user_sessions').where('user_id', '==', uid).orderBy('created_at', 'desc').limit(50).get();
    const items: any[] = [];
    q.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });

    return NextResponse.json({ ok: true, sessions: items });
  } catch (err: any) {
    console.error('Failed to list sessions:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
