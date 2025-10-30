import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return NextResponse.json({ ok: false }, { status: 400 });
    const token = authHeader.split(' ')[1];

    const q = await admin.firestore().collection('admin_sessions').where('token', '==', token).limit(1).get();
    if (q.empty) return NextResponse.json({ ok: true });
    const doc = q.docs[0];
    await admin.firestore().collection('admin_sessions').doc(doc.id).delete();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Admin logout failed:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
