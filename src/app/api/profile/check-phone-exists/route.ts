import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = (body?.phone || '').toString().trim();
    if (!phone) {
      return NextResponse.json({ error: 'Missing phone' }, { status: 400 });
    }

    // Normalize phone (basic) - expect callers to send E.164 when possible
    const normalized = phone.replace(/[\s()\-]/g, '');

    // Optionally accept a bearer token to treat same-user as non-conflicting
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let requesterUid: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        requesterUid = decoded.uid;
      } catch (e) {
        requesterUid = null;
      }
    }

    try {
      const user = await admin.auth().getUserByPhoneNumber(normalized);
      if (user) {
        if (requesterUid && user.uid === requesterUid) {
          return NextResponse.json({ exists: false, sameUser: true });
        }
        return NextResponse.json({ exists: true, uid: user.uid });
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || /no user record/.test(err?.message || '')) {
        return NextResponse.json({ exists: false });
      }
      console.error('check-phone-exists error:', err);
      return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
    }

    return NextResponse.json({ exists: false });
  } catch (err: any) {
    console.error('check-phone-exists route error:', err);
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}
