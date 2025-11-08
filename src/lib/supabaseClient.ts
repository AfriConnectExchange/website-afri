/*
  Minimal Supabase client helpers.

  - Exports a browser `supabase` client using NEXT_PUBLIC_* env vars.
  - Exports a `createServerSupabase` factory for server-side helpers (uses service role key).

  Notes:
  - Install the client: `npm install @supabase/supabase-js` (or use pnpm/yarn).
  - Set these env vars in your environment or .env:
      NEXT_PUBLIC_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY
      SUPABASE_SERVICE_ROLE_KEY (server-side only)
  - Server functions that verify JWTs should be updated to validate Supabase JWTs (or use the service role key).
*/
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this non-fatal: some scripts may not have envs at author-time.
  // Logging helps during development.
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars not set: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  // helpful defaults; can be extended if needed
  auth: {
    // do not persist session on server-side requests
  },
});

export function createServerSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceRole) {
    // eslint-disable-next-line no-console
    console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set for server Supabase client');
  }
  return createClient(url, serviceRole, {
    // server-side: do not store cookies/client session
    auth: { persistSession: false },
  });
}

export default supabase;
