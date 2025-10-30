
'use server';

import admin from '@/lib/firebaseAdmin';

interface ActivityLogPayload {
  user_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  changes?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Logs a user activity to Firestore.
 */
export async function logActivity(payload: ActivityLogPayload) {
  try {
    // Remove any undefined values from the payload (Firestore rejects undefined values)
    const removeUndefined = (val: any): any => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      if (Array.isArray(val)) return val.map(removeUndefined).filter((v) => v !== undefined);
      if (typeof val === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          const cleaned = removeUndefined(v);
          if (cleaned !== undefined) out[k] = cleaned;
        }
        return out;
      }
      return val;
    };

    const safeChanges = removeUndefined(payload.changes ?? {});

    await admin.firestore().collection('activity_logs').add({
      user_id: payload.user_id,
      action: payload.action,
      entity_type: payload.entity_type ?? null,
      entity_id: payload.entity_id ?? null,
      changes: safeChanges,
      ip_address: payload.ip_address ?? null,
      user_agent: payload.user_agent ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log user activity to Firestore:', err);
  }
}
