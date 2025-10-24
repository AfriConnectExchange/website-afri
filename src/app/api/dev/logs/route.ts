import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/utils'

const isAllowed = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_SEED === 'true'

export async function GET(req: Request) {
  if (!isAllowed) return NextResponse.json({ error: 'not-allowed' }, { status: 403 })

  try {
    const admin = getAdminSupabase()
    const { data, error } = await admin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, logs: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
