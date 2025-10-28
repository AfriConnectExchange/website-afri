// Temporary shim for Supabase server helpers used by API routes.
// Replace with Firebase Admin equivalents during migration and delete these stubs.
export function createServerClient() {
  return {
    auth: {
      async signUp(_opts: any) {
        return { error: new Error('Supabase server shim - migrate to Firebase Admin') };
      },
      async getUserByCookie(_req: any) {
        return null;
      }
    },
    from: (_table: string) => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) })
    })
  } as any;
}

export function createClient() {
  return createServerClient();
}
