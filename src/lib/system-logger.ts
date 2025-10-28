
'use server';

import admin from '@/lib/firebaseAdmin';

type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  type: string; // e.g., 'escrow_creation', 'user_login', 'product_view'
  status?: 'success' | 'failure' | 'pending';
  amount?: number;
  description: string;
  order_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Logs a critical system event to Firestore.
 * Accepts either a user id string or an object with an id property.
 */
export async function logSystemEvent(userOrId: { id: string } | string, payload: LogPayload) {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  try {
    await admin.firestore().collection('transactions').add({
      profile_id: userId,
      type: payload.type,
      status: payload.status || 'completed',
      amount: payload.amount || 0,
      description: payload.description,
      order_id: payload.order_id ?? null,
      provider: 'system',
      metadata: payload.metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('CRITICAL: Failed to log system event to Firestore:', err);
  }
}
