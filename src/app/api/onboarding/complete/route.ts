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

  const { error } = await (supabaseAdmin as any)
    .from('user_onboarding_progress')
    .upsert({ user_id: user.id, walkthrough_completed: true, current_step: 999, completed_at: new Date().toISOString() }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to persist onboarding progress', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
