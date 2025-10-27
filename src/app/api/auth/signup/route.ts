import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
  }
  const supabase = createServerClient();
  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // Optionally create profile row
  if (data.user && name) {
    await supabase.from('users').insert({ id: data.user.id, email, full_name: name });
  }
  return NextResponse.json({ success: true, user: data.user });
}
