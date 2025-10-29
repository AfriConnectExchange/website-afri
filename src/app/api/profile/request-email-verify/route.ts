import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const profile = userDoc.exists ? userDoc.data() as any : null;
    const email = profile?.email;
    if (!email) {
      return NextResponse.json({ error: 'No email set on profile' }, { status: 400 });
    }

    try {
      // Attempt to ensure the Auth user has the email set (may throw if email in use)
      await admin.auth().updateUser(uid, { email });
    } catch (err: any) {
      console.error('admin.updateUser error:', err);
      if (err?.code === 'auth/email-already-exists' || err?.message?.includes('already exists')) {
        return NextResponse.json({ error: 'Email already in use by another account' }, { status: 409 });
      }
      // continue — we still try to send the verification link if possible
    }

    try {
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);
      await sendEmail({
        to: email,
        subject: 'Verify your email — AfriConnect Exchange',
        text: `Please verify your email by visiting: ${verificationLink}`,
        html: `<p>Please verify your email by clicking <a href="${verificationLink}">this link</a>.</p>`,
      }, uid);
    } catch (sendErr) {
      console.error('Failed to generate/send verification link:', sendErr);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('request-email-verify error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
