import { createServerClient } from '@supabase/ssr'
import {Database} from "@/lib/types";

export async function createServerAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Prefer the PRIVATE env var, but fall back to any available supabase service key for dev convenience.
    const serviceKey = process.env.PRIVATE_SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase URL or Service Role Key. Set PRIVATE_SUPABASE_SERVICE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_SERVICE_KEY in your environment.');
    }

    // Warn if using a NEXT_PUBLIC key (it's insecure to expose service role key client-side).
    if (process.env.PRIVATE_SUPABASE_SERVICE_KEY == null && process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY) {
        // eslint-disable-next-line no-console
        console.warn('Using NEXT_PUBLIC_SUPABASE_SERVICE_KEY as a fallback for the admin client. For production, set PRIVATE_SUPABASE_SERVICE_KEY and do NOT expose your service key to the browser.');
    }

    return createServerClient<Database>(
        url,
        serviceKey,
        {
            cookies: {
                getAll: () => [],
                setAll: () => {},
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            db: {
                schema: 'public'
            },
        }
    );
}