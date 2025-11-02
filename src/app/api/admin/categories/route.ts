import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: Request) {
  try {
    const q = await admin.firestore().collection('categories').orderBy('name').limit(500).get();
    const items = q.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Build hierarchical tree structure
    const buildTree = (items: any[]): any[] => {
      const itemMap = new Map();
      const roots: any[] = [];

      // First pass: create a map of all items
      items.forEach(item => {
        itemMap.set(item.id, { ...item, children: [] });
      });

      // Second pass: build the tree
      items.forEach(item => {
        const node = itemMap.get(item.id);
        if (item.parent_id && itemMap.has(item.parent_id)) {
          // This is a child - add it to its parent
          const parent = itemMap.get(item.parent_id);
          parent.children.push(node);
        } else {
          // This is a root node
          roots.push(node);
        }
      });

      return roots;
    };

    const tree = buildTree(items);
    return NextResponse.json({ success: true, categories: tree });
  } catch (err: any) {
    console.error('Failed to list categories:', err);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const allowed = await verifyAdminRequest(req);
    if (!allowed) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { name, description = null, is_active = true, image_url = null } = body || {};

    if (!name) return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });

    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await admin.firestore().collection('categories').add({
      name: String(name),
      type: 'product',
      parent_id: null,
      description: description || null,
      is_active: Boolean(is_active),
      image_url: image_url || null,
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err: any) {
    console.error('Failed to create category:', err);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
