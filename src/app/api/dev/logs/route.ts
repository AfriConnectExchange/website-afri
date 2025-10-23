import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, user_id, action, entity_type, entity_id, changes, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Error fetching activity logs', error)
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Activity logs GET error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
