
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decodedToken.uid);

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified.' }, { status: 400 });
    }
    
    if (!user.email) {
      return NextResponse.json({ error: 'User does not have an email to verify.' }, { status: 400 });
    }

    const link = await admin.auth().generateEmailVerificationLink(user.email);
    
    // In a real app, you would send this link via your email service
    console.log(`Verification link for ${user.email}: ${link}`);

    return NextResponse.json({ success: true, message: 'Verification email sent.' });

  } catch (err: any) {
    console.error('Resend verification error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to resend verification' }, { status: 500 });
  }
}

    