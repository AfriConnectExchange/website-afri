import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { z } from 'zod';

const ItemSchema = z.object({
  name: z.string().min(1, 'name is required'),
  type: z.string().min(1, 'type is required'),
  parent_id: z.string().nullable().optional(),
  parent_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const RequestWrapper = z.union([
  z.array(ItemSchema),
  z.object({ items: z.array(ItemSchema), options: z.object({ auto_create_parents: z.boolean().optional() }).optional() }),
]);

function normalizeKey(name: string, type: string) {
  return `${String(name).trim().toLowerCase()}__${String(type).trim().toLowerCase()}`;
}

type ItemErr = { index: number; code: string; message: string; details?: any };

export async function POST(req: Request) {
  try {
    const allowed = await verifyAdminRequest(req);
    if (!allowed) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });

    const raw = await req.json().catch(() => null);
    const parsed = RequestWrapper.safeParse(raw);
    if (!parsed.success) {
      // If top-level parse failed, but raw was an array attempt to coerce and validate items one-by-one below
      if (!Array.isArray(raw)) {
        return NextResponse.json({ ok: false, error: 'Expected an array of categories or { items, options }' }, { status: 400 });
      }
      // else fallthrough to validate items array
    }

    let items: z.infer<typeof ItemSchema>[] = [];
    let options: { auto_create_parents?: boolean } = {};
    if (parsed.success) {
      if (Array.isArray(parsed.data)) items = parsed.data;
      else {
        items = parsed.data.items;
        options = parsed.data.options ?? {};
      }
    } else {
      items = Array.isArray(raw) ? raw : [];
    }

    const autoCreateParents = Boolean(options.auto_create_parents ?? false);

    // Load existing categories once and index by normalized name+type and by id
    const existingSnap = await admin.firestore().collection('categories').get();
    const existingByKey = new Map<string, { id: string; data: any }>();
    const existingById = new Map<string, any>();
    existingSnap.docs.forEach((d) => {
      const data = d.data();
      const key = normalizeKey(data.name || '', data.type || '');
      existingByKey.set(key, { id: d.id, data });
      existingById.set(d.id, data);
    });

    const created: Array<{ index: number; id: string }> = [];
    const skipped: Array<{ index: number; reason: string }> = [];
    const errors: ItemErr[] = [];
    const createdKeys = new Set<string>();

    // Helper to create a parent category when needed
    async function createParentIfNeeded(parentName: string, type: string) {
      const pkey = normalizeKey(parentName, type);
      // Already exists
      if (existingByKey.has(pkey)) return existingByKey.get(pkey)!.id;
      // Create
      const now = admin.firestore.FieldValue.serverTimestamp();
      const docRef = await admin.firestore().collection('categories').add({
        name: parentName,
        type,
        parent_id: null,
        description: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
      // write a lightweight placeholder into our maps (id known, data minimal)
      existingByKey.set(pkey, { id: docRef.id, data: { name: parentName, type } });
      existingById.set(docRef.id, { name: parentName, type });
      createdKeys.add(pkey);
      return docRef.id;
    }

    for (let i = 0; i < items.length; i++) {
      const rawItem = items[i];
      const v = ItemSchema.safeParse(rawItem);
      if (!v.success) {
        errors.push({ index: i, code: 'validation', message: 'Item failed validation', details: v.error.format() });
        continue;
      }
      const it = v.data;

      const name = String(it.name).trim();
      const type = String(it.type).trim();
      const key = normalizeKey(name, type);

      // Strict duplicate: check existing DB and this batch's created items
      if (existingByKey.has(key) || createdKeys.has(key)) {
        skipped.push({ index: i, reason: 'duplicate' });
        continue;
      }

      // Resolve parent if provided
      let parentId: string | null = null;
      if (it.parent_id) {
        if (!existingById.has(it.parent_id)) {
          errors.push({ index: i, code: 'parent_not_found', message: 'Parent id not found', details: { parent_id: it.parent_id } });
          continue;
        }
        parentId = it.parent_id;
      } else if (it.parent_name) {
        // find by name+type (same type assumed)
        const pkey = normalizeKey(it.parent_name, type);
        const p = existingByKey.get(pkey);
        if (!p) {
          if (autoCreateParents) {
            try {
              parentId = await createParentIfNeeded(it.parent_name!, type);
            } catch (err: any) {
              errors.push({ index: i, code: 'parent_create_failed', message: 'Failed to create parent', details: err?.message ?? String(err) });
              continue;
            }
          } else {
            errors.push({ index: i, code: 'parent_not_found', message: 'Parent name not found', details: { parent_name: it.parent_name } });
            continue;
          }
        } else {
          parentId = p.id;
        }
      }

      // Create category
      try {
        const now = admin.firestore.FieldValue.serverTimestamp();
        const docRef = await admin.firestore().collection('categories').add({
          name,
          type,
          parent_id: parentId ?? null,
          description: it.description ?? null,
          is_active: it.is_active !== undefined ? Boolean(it.is_active) : true,
          created_at: now,
          updated_at: now,
        });
        created.push({ index: i, id: docRef.id });
        createdKeys.add(key);
        // add to existing maps so later items in batch can reference this newly created category
        existingByKey.set(key, { id: docRef.id, data: { name, type } });
        existingById.set(docRef.id, { name, type });
      } catch (err: any) {
        errors.push({ index: i, code: 'write_failed', message: 'Write failed', details: err?.message ?? String(err) });
      }
    }

    return NextResponse.json({ ok: true, created, skipped, errors, auto_create_parents: autoCreateParents });
  } catch (err: any) {
    console.error('Bulk upload failed:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
