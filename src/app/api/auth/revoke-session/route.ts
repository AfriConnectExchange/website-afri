import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createServerClient();
  const supabaseAdmin = await import('@/lib/supabase/serverAdminClient').then(m => m.createServerAdminClient());
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { session_id, device_id } = body;
  // Supabase client typing for chained updates can be strict; use any for flexibility
  let updateQuery: any = (supabaseAdmin as any).from('user_sessions');

  if (session_id) updateQuery = updateQuery.update({ is_active: false, revoked_at: new Date().toISOString() }).eq('id', session_id);
  else if (device_id) updateQuery = updateQuery.update({ is_active: false, revoked_at: new Date().toISOString() }).eq('device_id', device_id).eq('user_id', user.id);
  else return NextResponse.json({ error: 'session_id or device_id required' }, { status: 400 });

  const { error } = await updateQuery;
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true });
}
