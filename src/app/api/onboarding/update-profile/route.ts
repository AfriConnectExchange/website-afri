import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { id, full_name, phone, address, roles } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'User ID required.' }, { status: 400 });
  }
  const supabase = createServerClient();
  // Only allow update for current user
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.user.id !== id) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { error } = await supabase
    .from('users')
    .update({ full_name, phone, address, roles })
    .eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
