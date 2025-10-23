import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, context: any) {
  const params = typeof context?.params?.then === 'function' ? await context.params : context.params
  const { id } = params || {}

  try {
    const supabase = await createServerClient()

    // Try find by id first
    const { data: byId, error: errById } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (errById) {
      console.error('Product fetch error by id', errById)
    }

    if (byId && byId.length > 0) {
      return NextResponse.json(byId[0])
    }

    // Try by slug
    const { data: bySlug, error: errBySlug } = await supabase
      .from('products')
      .select('*')
      .eq('slug', id)
      .limit(1)

    if (errBySlug) {
      console.error('Product fetch error by slug', errBySlug)
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    if (bySlug && bySlug.length > 0) return NextResponse.json(bySlug[0])

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    console.error('Product GET error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
