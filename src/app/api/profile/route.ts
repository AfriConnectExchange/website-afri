import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

  const idToken = match[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const body = await req.json();
    const displayName = body.displayName ?? null;

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    await userRef.set(
      {
        uid,
        email: decoded.email || null,
        displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('auth verify or db error', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
