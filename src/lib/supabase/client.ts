// Lightweight supabase client factory.
// If NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are provided,
// return a real Supabase client that performs network requests. Otherwise
// return a stub client that avoids making network calls (useful for local
// dev without secrets).

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createStubClient(): any {
    const noOp = async () => ({ data: null, error: null });

    const queryBuilder: any = {
        select: () => queryBuilder,
        eq: () => queryBuilder,
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        limit: () => queryBuilder,
        order: () => queryBuilder,
        range: () => queryBuilder,
        insert: noOp,
        update: noOp,
        delete: noOp,
    };

    return {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            signInWithPassword: async () => ({ data: null, error: null }),
            signUp: async () => ({ data: null, error: null }),
            signOut: async () => ({ error: null }),
            onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: () => queryBuilder,
        storage: {
            from: () => ({ upload: async () => ({ data: null, error: null }), list: async () => ({ data: [], error: null }), remove: async () => ({ data: null, error: null }), createSignedUrl: async () => ({ data: null, error: null }) }),
        },
    } as any;
}

let cachedClient: SupabaseClient | any | null = null;

export function createSPAClient(): SupabaseClient | any {
    // Return cached instance when available to avoid creating multiple
    // GoTrueClient instances in the same browser context which causes
    // the "Multiple GoTrueClient instances detected" warnings and can
    // lead to undefined behavior.
    if (cachedClient) return cachedClient;

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        // Create a real Supabase client for browser/SPA usage
        cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                detectSessionInUrl: true,
            },
        });
        return cachedClient;
    }

    // Fallback stub with a warning so developers know why no network calls occur.
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.warn('Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Using stub client — no network requests will be made.');
    }
    cachedClient = createStubClient();
    return cachedClient;
}

export async function createSPASassClient() {
    return createSPAClient() as any;
}

export async function createSPASassClientAuthenticated() {
    return createSPAClient() as any;
}