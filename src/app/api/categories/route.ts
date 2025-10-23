import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, icon_url, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Categories GET error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
