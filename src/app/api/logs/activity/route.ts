import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase/utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const event_type = body?.event_type || body?.type || 'visit'
    const payload = body?.payload ?? null

    const ua = req.headers.get('user-agent') || null
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || null

    // Use cookie-aware client to optionally associate user
    const res = NextResponse.next()
    const cookieHeader = req.headers.get('cookie')
    const cookiesAdapter = (await import('@/lib/supabase/utils')).createCookiesAdapter(cookieHeader, res)

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '', { cookies: cookiesAdapter }) as any
    const { data } = await supabase.auth.getUser()
    const user = data?.user

    const admin = getAdminSupabase()
    const { error } = await admin.from('activity_logs').insert([{ event_type, payload, user_agent: ua, ip, user_id: user?.id ?? null }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
