import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const user = await admin.auth().getUser(uid);

    // If email is verified, persist that to Firestore for reporting/UI
    if (user.emailVerified) {
      try {
        await admin.firestore().collection('users').doc(uid).set({
          email_verified: true,
          email_verified_at: admin.firestore.FieldValue.serverTimestamp(),
          verification_status: 'verified',
        }, { merge: true });
      } catch (writeErr) {
        console.warn('Failed to update Firestore email verification metadata:', writeErr);
      }
    }

    return NextResponse.json({ emailVerified: user.emailVerified });
  } catch (err: any) {
    console.error('check-email-verified error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
