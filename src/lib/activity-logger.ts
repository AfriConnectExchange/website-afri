
'use server';

import { createServerClient } from '@/lib/supabase/server';

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
 * Logs a user activity to the database.
 * @param payload - The data to be logged.
 */
export async function logActivity(payload: ActivityLogPayload) {
  const supabase = createServerClient();

  const { error } = await supabase.from('activity_logs').insert({
    user_id: payload.user_id,
    action: payload.action,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    changes: payload.changes,
    ip_address: payload.ip_address,
    user_agent: payload.user_agent,
  });

  if (error) {
    console.error('Failed to log user activity:', error);
    // This failure should not block user flow, but it's important to log it.
  }
}
