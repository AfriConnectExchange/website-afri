import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });

    // Create or merge profile in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      full_name: name ?? null,
      created_at: new Date().toISOString(),
      roles: [],
    }, { merge: true });

    return NextResponse.json({ success: true, user: { id: userRecord.uid, email, name } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create user' }, { status: 400 });
  }
}
