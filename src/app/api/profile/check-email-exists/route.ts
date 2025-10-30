import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || '').toString().trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // Verify caller token (optional) to allow the server to treat the same-user
    // case as not-conflicting.
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let requesterUid: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        requesterUid = decoded.uid;
      } catch (e) {
        // ignore - treat as anonymous caller
        requesterUid = null;
      }
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      // If the email belongs to the requesting user, consider it non-conflicting
      if (requesterUid && userRecord.uid === requesterUid) {
        return NextResponse.json({ exists: false, sameUser: true });
      }
      return NextResponse.json({ exists: true, uid: userRecord.uid, emailVerified: userRecord.emailVerified });
    } catch (err: any) {
      // If the user isn't found, getUserByEmail throws an error we interpret as not existing
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || /no user record/.test(err?.message || '')) {
        return NextResponse.json({ exists: false });
      }
      console.error('check-email-exists error:', err);
      return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
    }

  } catch (err: any) {
    console.error('check-email-exists route error:', err);
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}
