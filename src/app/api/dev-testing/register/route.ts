import { NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { sendEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, full_name } = body;
  if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });

  const supabase = await createServerAdminClient();

  // Try to create the auth user using the Admin API (service role)
  try {
    // supabase-js admin APIs vary by version; use REST if needed
    const { data: authUser, error: authErr } = await (supabase as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr) {
      // Fallback: if admin.createUser not available, use auth.signUp via admin client
      console.warn('admin.createUser failed, trying fallback:', authErr.message || authErr);
    }

    // Determine the final user id: prefer admin-created id, otherwise look up existing profile
    let finalUserId: string | null = authUser?.id ?? null;
    if (!finalUserId) {
      const { data: existingUser, error: existingErr } = await (supabase as any).from('users').select('id').eq('email', email).maybeSingle();
      if (existingErr) console.warn('Error looking up existing user by email:', existingErr);
      if (existingUser && existingUser.id) {
        finalUserId = existingUser.id;
      }
    }

    // Insert a public.users profile (idempotent) - use finalUserId if available
    await (supabase as any).from('users').upsert({ id: finalUserId || undefined, email, full_name }, { onConflict: 'id' });

    // Insert onboarding progress
    await (supabase as any).from('user_onboarding_progress').upsert({ user_id: finalUserId || null, walkthrough_completed: false }, { onConflict: 'user_id' });

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to AfriConnect',
        text: `Welcome ${full_name || ''}!`,
        html: `<p>Welcome ${full_name || ''}!</p>`,
      });
    } catch (e) {
      console.error('Failed to send welcome email:', e);
    }

  return NextResponse.json({ success: true, id: finalUserId || null });

  } catch (e: any) {
    console.error('Dev register failed:', e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
