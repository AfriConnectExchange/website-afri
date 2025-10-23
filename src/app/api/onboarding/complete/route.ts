import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use the admin client for the DB write to avoid RLS permission issues
  const supabaseAdmin = await import('@/lib/supabase/serverAdminClient').then(m => m.createServerAdminClient());

  const table = (supabaseAdmin as any).from('user_onboarding_progress');

  // Ensure a corresponding `users` row exists in the application schema.
  // Supabase Auth can create a user in the auth schema, but many apps also maintain
  // a `public.users` profile table. If that row is missing, foreign key inserts will fail.
  try {
    const usersTable = (supabaseAdmin as any).from('users');
    const { data: existingUser, error: fetchUserErr } = await usersTable.select('id').eq('id', user.id).maybeSingle();
    if (fetchUserErr) {
      console.warn('Error checking users table for onboarding:', fetchUserErr.message || fetchUserErr);
    }

    if (!existingUser) {
      // Insert a minimal profile row so foreign keys work. Expand fields as needed.
      const profile: any = {
        id: user.id,
        email: (user.email as string) || null,
        full_name: (user.user_metadata && (user.user_metadata as any).name) || null,
        created_at: new Date().toISOString(),
      };

      const { error: insertUserErr } = await usersTable.insert(profile);
      if (insertUserErr) {
        console.error('Failed to create users profile for onboarding:', insertUserErr);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
      console.info('Created minimal users row for', user.id);
    }
  } catch (e) {
    console.error('Unexpected error ensuring users row exists:', e);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }

  const payloadWithStep = { user_id: user.id, walkthrough_completed: true, current_step: 999, completed_at: new Date().toISOString() };
  const payloadWithoutStep = { user_id: user.id, walkthrough_completed: true, completed_at: new Date().toISOString() };

  // Try upsert with the `current_step` column first (older deployments may expect it).
  let upsertResult = await table.upsert(payloadWithStep, { onConflict: 'user_id' });

  // If the schema doesn't have `current_step`, PostgREST returns PGRST204.
  if (upsertResult.error && upsertResult.error.code === 'PGRST204') {
    console.warn("'current_step' column not found in user_onboarding_progress, retrying without it");
    upsertResult = await table.upsert(payloadWithoutStep, { onConflict: 'user_id' });
  }

  if (upsertResult.error) {
    console.error('Failed to persist onboarding progress', upsertResult.error);
    return NextResponse.json({ error: upsertResult.error.message }, { status: 500 });
  }

  // Send welcome email asynchronously (don't block the response)
  try {
    const { sendWelcomeEmail } = await import('@/lib/welcome-email');
    // fire-and-forget; errors are logged inside helper
    sendWelcomeEmail(user.id).catch((e) => console.error('Welcome email failed:', e));
  } catch (e) {
    console.error('Failed to load welcome-email helper:', e);
  }

  return NextResponse.json({ success: true });
}
