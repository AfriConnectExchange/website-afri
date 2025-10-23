'use server';

// Supabase removed — fall back to logging events to the server console so the
// call sites continue to work without throwing. If you want persistent logs,
// implement a new storage backend (file, 3rd-party logging service, etc.).
type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  type: string; // e.g., 'escrow_creation', 'user_login', 'product_view'
  status?: 'success' | 'failure' | 'pending';
  amount?: number;
  description: string;
  order_id?: string;
  metadata?: Record<string, any>;
}

export async function logSystemEvent(user: any, payload: LogPayload) {
  try {
    // eslint-disable-next-line no-console
    console.log('[system-log] user=', user?.id ?? null, 'payload=', payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to log system event to console fallback:', err);
  }
}
