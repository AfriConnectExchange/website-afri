import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createServerClient();
  const supabaseAdmin = await import('@/lib/supabase/serverAdminClient').then(m => m.createServerAdminClient());

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const {
    device_id,
    device_type,
    device_name,
    browser,
    os,
    ip_address,
    user_agent,
    location_data,
    remember = false,
    session_token,
    refresh_token,
    fingerprint
  } = body;

  // Hash tokens before storing
  const session_token_hash = session_token ? await bcrypt.hash(session_token, 10) : null;
  const refresh_token_hash = refresh_token ? await bcrypt.hash(refresh_token, 10) : null;

  // Upsert device_info
  const { error: devErr } = await (supabaseAdmin as any).from('device_info').upsert({
    device_id,
    user_id: user.id,
    device_type,
    device_name,
    platform: device_type,
    browser_name: browser,
    os_name: os,
    ip_address,
    user_agent,
    fingerprint_hash: fingerprint ? await bcrypt.hash(fingerprint, 10) : null,
    last_authenticated_at: new Date().toISOString()
  }, { onConflict: 'device_id' });

  if (devErr) return NextResponse.json({ error: 'Failed to upsert device' }, { status: 500 });

  // Create session row
  const expires_at = new Date(Date.now() + (remember ? 30 * 24 * 3600 * 1000 : 24 * 3600 * 1000));
  const { data: sessionData, error: sessErr } = await (supabaseAdmin as any).from('user_sessions').insert({
    user_id: user.id,
    device_id,
    device_type,
    device_name,
    browser,
    os,
    ip_address,
    user_agent,
    location_data,
    session_token: null, // raw token not stored
    session_token_hash,
    refresh_token_hash,
    expires_at: expires_at.toISOString(),
    is_active: true,
  }).select().single();

  if (sessErr) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });

  return NextResponse.json({ success: true, session: sessionData });
}
