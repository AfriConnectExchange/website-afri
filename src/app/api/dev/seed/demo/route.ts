import { NextResponse } from 'next/server'

// Allow dev seeding when in development OR when explicitly enabled via env var
const isAllowed = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_SEED === 'true'

/**
 * Dev-only seeding endpoint to create a verified Supabase user using the
 * service role key. POST { email } creates a user (email confirmed).
 * DELETE { user_id } removes the user.
 *
 * WARNING: This route should only be used in development. It leverages the
 * Supabase admin REST API and requires a service role key in environment.
 */
export async function POST(req: Request) {
  if (!isAllowed) return NextResponse.json({ error: 'not-allowed - enable by setting ALLOW_DEV_SEED=true or run in development' }, { status: 403 })

  try {
    const body = await req.json()
    const email = body?.email
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PRIVATE_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || ''
    if (!serviceKey) return NextResponse.json({ error: 'missing service role key' }, { status: 500 })

    const password = body?.password || Math.random().toString(36).slice(2) + 'A1!'

    const res = await fetch(`${url}/admin/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey
      },
      body: JSON.stringify({ email, password, email_confirm: true })
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ error: data?.message || data || 'failed to create user' }, { status: res.status })

    return NextResponse.json({ ok: true, user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!isAllowed) return NextResponse.json({ error: 'not-allowed - enable by setting ALLOW_DEV_SEED=true or run in development' }, { status: 403 })

  try {
    const body = await req.json()
    const user_id = body?.user_id
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PRIVATE_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || ''
    if (!serviceKey) return NextResponse.json({ error: 'missing service role key' }, { status: 500 })

    const res = await fetch(`${url}/admin/v1/users/${encodeURIComponent(user_id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey
      }
    })

    if (res.status === 204) return NextResponse.json({ ok: true })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ error: data?.message || 'failed to delete user' }, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
