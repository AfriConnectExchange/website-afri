
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
    await admin.firestore().collection('activity_logs').add({
      user_id: payload.user_id,
      action: payload.action,
      entity_type: payload.entity_type ?? null,
      entity_id: payload.entity_id ?? null,
      changes: payload.changes ?? {},
      ip_address: payload.ip_address ?? null,
      user_agent: payload.user_agent ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log user activity to Firestore:', err);
  }
}
