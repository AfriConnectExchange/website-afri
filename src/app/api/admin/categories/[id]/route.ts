import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await admin.firestore().collection('categories').doc(id).get();
    if (!doc.exists) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err: any) {
    console.error('Failed to get category:', err);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const allowed = await verifyAdminRequest(req);
    if (!allowed) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const update: any = {};
    if (body.name !== undefined) update.name = String(body.name);
    // Enforce top-level only
    update.parent_id = null;
    if (body.image_url !== undefined) update.image_url = body.image_url || null;
    if (body.description !== undefined) update.description = body.description || null;
    if (body.is_active !== undefined) update.is_active = Boolean(body.is_active);
    update.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection('categories').doc(id).update(update);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to update category:', err);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const allowed = await verifyAdminRequest(req);
    if (!allowed) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;
    // Soft-delete: set is_active = false and updated_at
    await admin.firestore().collection('categories').doc(id).update({ is_active: false, updated_at: admin.firestore.FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete category:', err);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

// Support PUT for updates (same behavior as PATCH)
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return PATCH(req, ctx);
}
