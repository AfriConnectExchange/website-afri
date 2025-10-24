import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { parseCookies, getAdminSupabase } from '@/lib/supabase/utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const deviceId = body?.device_id || body?.deviceId || null
    const info = body?.info || {}
    if (!deviceId) return NextResponse.json({ error: 'device_id required' }, { status: 400 })

    // Build response to let cookie adapter set cookies if needed
    const res = NextResponse.next()
    const cookieHeader = req.headers.get('cookie')
    const cookiesAdapter = (await import('@/lib/supabase/utils')).createCookiesAdapter(cookieHeader, res)

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '', { cookies: cookiesAdapter }) as any
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    const userId = user?.id ?? null

    // Use admin client for DB write (server-only)
    const admin = getAdminSupabase()
    const { error } = await admin.from('devices').insert([{ device_id: deviceId, user_id: userId, info }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
