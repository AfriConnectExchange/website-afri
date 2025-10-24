import { NextResponse } from 'next/server'

/**
 * Set session cookies for supabase access and refresh tokens.
 * Expected body: { access_token, refresh_token }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const access = body?.access_token
    const refresh = body?.refresh_token
    if (!access) return NextResponse.json({ error: 'access_token required' }, { status: 400 })

    const res = NextResponse.json({ ok: true })
    const secure = process.env.NODE_ENV === 'production'

    // set cookies (httpOnly)
    res.cookies.set('sb-access-token', access, {
      httpOnly: true,
      path: '/',
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    if (refresh) {
      res.cookies.set('sb-refresh-token', refresh, {
        httpOnly: true,
        path: '/',
        secure,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      })
    }

    return res
  } catch (err) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }
}
