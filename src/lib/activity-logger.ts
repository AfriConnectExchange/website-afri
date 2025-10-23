'use server';

// Supabase removed — fallback to console-based activity logging. This keeps
// call sites working without requiring a DB.

interface ActivityLogPayload {
  user_id?: string | null;
  action: string;
  entity_type?: string;
  entity_id?: string;
  changes?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
}

export async function logActivity(payload: ActivityLogPayload) {
  try {
    // eslint-disable-next-line no-console
    console.log('[activity-log]', payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to write activity log to console fallback:', err);
  }
}
