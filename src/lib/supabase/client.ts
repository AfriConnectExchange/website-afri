// Temporary shim for Supabase client to allow incremental migration to Firebase.
// These stubs should be removed once all Supabase usages are migrated.
export function createSPAClient() {
  return {
    auth: {
      // keep the old method name used in the UI; return a consistent shape
      async signInWithOAuth(_opts: any) {
        return { error: new Error('Supabase client removed - use Firebase auth instead') };
      },
      async getSession() {
        return { data: { session: null } };
      }
    }
  } as any;
}

export default { createSPAClient };
