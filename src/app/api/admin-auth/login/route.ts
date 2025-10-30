import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyPassword, createSessionToken } from '@/lib/admin-auth';

const ACCOUNTS = 'admin_accounts';
const SESSIONS = 'admin_sessions';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body || {};
    if (!username || !password) return NextResponse.json({ ok: false, error: 'Missing' }, { status: 400 });

    const q = await admin.firestore().collection(ACCOUNTS).where('username', '==', String(username)).limit(1).get();
    if (q.empty) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    const doc = q.docs[0];
    const acc = doc.data() as any;
    if (!acc.is_active) return NextResponse.json({ ok: false, error: 'Account disabled' }, { status: 403 });

    const ok = verifyPassword(String(password), acc.password_salt, acc.password_hash);
    if (!ok) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });

    const token = createSessionToken();
    const now = admin.firestore.FieldValue.serverTimestamp();
    // expire in 7 days
    const expires = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 3600 * 1000));

    await admin.firestore().collection(SESSIONS).add({
      username: acc.username,
      token,
      created_at: now,
      expires_at: expires,
    });

    return NextResponse.json({ ok: true, token });
  } catch (err: any) {
    console.error('Admin login failed:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
