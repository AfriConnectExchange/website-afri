import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { parseCookies } from '@/lib/supabase/utils'

export async function GET(req: Request) {
  try {
    const res = NextResponse.next()
    const cookieHeader = req.headers.get('cookie')
    const cookiesAdapter = (await import('@/lib/supabase/utils')).createCookiesAdapter(cookieHeader, res)

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '', { cookies: cookiesAdapter }) as any
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    if (!user) return NextResponse.json({ authenticated: false }, { status: 200 })

    return NextResponse.json({ authenticated: true, user })
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}
