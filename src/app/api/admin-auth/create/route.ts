import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { hashPassword } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password, setup_secret } = body || {};

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: 'Missing username or password' }, { status: 400 });
    }

    // If any admin accounts exist, require setup secret
    const existing = await admin.firestore().collection('admin_accounts').limit(1).get();
    if (!existing.empty) {
      const secret = process.env.ADMIN_SETUP_SECRET || '';
      if (!secret || setup_secret !== secret) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
      }
    }

    // ensure username unique
    const q = await admin.firestore().collection('admin_accounts').where('username', '==', String(username)).limit(1).get();
    if (!q.empty) return NextResponse.json({ ok: false, error: 'Username already exists' }, { status: 409 });

    const { salt, hash } = hashPassword(String(password));
    const now = admin.firestore.FieldValue.serverTimestamp();
    const roles = ['admin'];

    const docRef = await admin.firestore().collection('admin_accounts').add({
      username: String(username),
      password_salt: salt,
      password_hash: hash,
      roles,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err: any) {
    console.error('Failed to create admin account:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
