// REMOVED: Supabase admin client removed. Keep placeholder to avoid import/runtime errors.

export async function createServerAdminClient() {
  // Return a safe admin stub that provides `.from()` chains used across the
  // codebase. Methods are no-ops and return shapes similar to Supabase.
  const noOp = async () => ({ data: null, error: null });

  const builder: any = {
    insert: noOp,
    update: noOp,
    delete: noOp,
    select: () => builder,
    maybeSingle: noOp,
    single: noOp,
    limit: () => builder,
    eq: () => builder,
    order: () => builder,
    range: () => builder,
    from: () => builder,
  };

  return {
    from: () => builder,
    auth: {
      admin: {
        createUser: noOp,
      },
    },
  } as any;
}