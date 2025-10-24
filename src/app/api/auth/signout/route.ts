import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: Request) {
  try {
    const res = NextResponse.redirect(new URL('/auth/signin', req.url))

    // Build cookie adapter that reads from incoming request and writes to our response
    const cookieHeader = req.headers.get('cookie')
  const cookieMap: Record<string, string> = {}
    if (cookieHeader) {
      const parts = cookieHeader.split(';')
      for (const p of parts) {
        const idx = p.indexOf('=')
        if (idx === -1) continue
        const name = p.slice(0, idx).trim()
        const value = p.slice(idx + 1).trim()
        cookieMap[name] = decodeURIComponent(value)
      }
    }

    const cookiesAdapter = (await import('@/lib/supabase/utils')).createCookiesAdapter(cookieHeader, res)

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '', { cookies: cookiesAdapter }) as any

    // Call signOut to revoke server session where applicable
    try {
      await supabase.auth.signOut()
    } catch (err) {
      // ignore
    }

    // Clear our local Supabase cookies as well
    res.cookies.delete('sb-access-token')
    res.cookies.delete('sb-refresh-token')

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
