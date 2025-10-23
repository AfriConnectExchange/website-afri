// Supabase removed — provide lightweight client stubs so frontend code that
// imports these functions does not crash. These stubs intentionally do no real
// auth or storage work.

export function createSPAClient() {
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

export async function createSPASassClient() {
    const client = createSPAClient();
    return client as any;
}

export async function createSPASassClientAuthenticated() {
    const client = createSPAClient();
    // Auth is stubbed — redirecting would be unexpected here; return the stub.
    return client as any;
}