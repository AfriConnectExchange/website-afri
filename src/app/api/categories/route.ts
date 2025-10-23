import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: categories, error: catErr } = await supabase
      .from('categories')
      .select('id, name, slug, description, icon_url, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (catErr) {
      console.error('Error fetching categories', catErr)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Fetch active products and compute counts per category
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('category_id')
      .eq('is_active', true)

    if (prodErr) {
      console.error('Error fetching products for category counts', prodErr)
      // Return categories with zero counts as fallback
      const fallback = (categories || []).map((c: any) => ({ ...c, count: 0 }))
      return NextResponse.json(fallback)
    }

  const counts: Record<string, number> = {} as Record<string, number>
    (products || []).forEach((p: any) => {
      const cid = p.category_id
      if (!cid) return
      counts[cid] = (counts[cid] || 0) + 1
    })

    const withCounts = (categories || []).map((c: any) => ({
      ...c,
      count: counts[c.id] || 0,
    }))

    return NextResponse.json(withCounts)
  } catch (err) {
    console.error('Categories GET error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
