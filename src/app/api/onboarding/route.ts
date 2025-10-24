import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const user_id = url.searchParams.get('user_id');
    if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

    if (!supabase) {
      // Dev fallback: return not found data
      return NextResponse.json({ user_id, walkthrough_completed: false }, { status: 200 });
    }

    const { data, error } = await supabase
      .from('user_onboarding_progress')
      .select('walkthrough_completed')
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ user_id, walkthrough_completed: data?.walkthrough_completed ?? false }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/onboarding] GET error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, walkthrough_completed } = body;
    if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

    if (!supabase) {
      // Dev fallback: echo back success
      // eslint-disable-next-line no-console
      console.log('[api/onboarding] dev-upsert', body);
      return NextResponse.json({ ok: true, user_id, walkthrough_completed: !!walkthrough_completed }, { status: 200 });
    }

    // Upsert onboarding progress for the user
    const payload = {
      user_id,
      walkthrough_completed: !!walkthrough_completed,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_onboarding_progress')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[api/onboarding] upsert error', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/onboarding] POST error', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
