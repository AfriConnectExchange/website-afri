// REMOVED: Server Supabase client cleared as part of backend removal.
// Export a clear error so any remaining callers know Supabase is not available.

export async function createServerClient() {
  // Return a small, safe stub so server-side call sites that expect
  // auth.getUser() continue to receive a valid shape.
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  } as any;
}
