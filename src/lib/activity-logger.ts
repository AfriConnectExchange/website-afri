
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';

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
  // Use admin client for writes to avoid RLS/permission issues on server-side logs
  const supabaseAdmin = await createServerAdminClient();
  let resolvedUserId: string | null = payload.user_id || null;
  // If user_id looks like an email (not UUID), try to resolve to the UUID in users table
  if (resolvedUserId && !/^[0-9a-fA-F-]{36}$/.test(resolvedUserId)) {
    try {
      const { data: found } = await (supabaseAdmin as any).from('users').select('id').eq('email', resolvedUserId).maybeSingle();
      if (found && found.id) resolvedUserId = found.id;
    } catch (e) {
      // ignore lookup errors and leave resolvedUserId as-is
    }
  }

  const { error } = await (supabaseAdmin as any).from('activity_logs').insert({
    user_id: resolvedUserId,
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
