import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: Request) {
  try {
    const q = await admin.firestore().collection('categories').orderBy('name').limit(500).get();
    const items = q.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, data: items });
  } catch (err: any) {
    console.error('Failed to list categories:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const allowed = await verifyAdminRequest(req);
    if (!allowed) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { name, type, parent_id = null, description = null, is_active = true } = body || {};

    if (!name || !type) return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });

    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await admin.firestore().collection('categories').add({
      name: String(name),
      type: String(type),
      parent_id: parent_id || null,
      description: description || null,
      is_active: Boolean(is_active),
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err: any) {
    console.error('Failed to create category:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
