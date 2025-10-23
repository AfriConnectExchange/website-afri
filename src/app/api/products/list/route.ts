import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const per_page = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') || '20')))
    const category = url.searchParams.get('category') // expects category id
    const search = url.searchParams.get('search')
    const tags = url.searchParams.get('tags') // comma separated
    const min_price = url.searchParams.get('min_price')
    const max_price = url.searchParams.get('max_price')
    const sort = url.searchParams.get('sort') || 'newest'

    const supabase = await createServerClient()

    // Build base query
    // Use the DB view that includes seller info for convenience and reduced joins
    let query: any = supabase
      .from('active_products_view')
      .select(
        `id, seller_id, category_id, title, slug, description, price, currency, is_free, images, tags, location, latitude, longitude, is_active, average_rating, review_count, created_at, updated_at, published_at, seller_name, seller_rating, category_name`,
        { count: 'exact' }
      )
      .eq('is_active', true)

    // Filters
    if (category) {
      query = query.eq('category_id', category)
    }

    if (min_price) query = query.gte('price', Number(min_price))
    if (max_price) query = query.lte('price', Number(max_price))

    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tagArray.length) query = query.overlaps('tags', tagArray)
    }

    if (search) {
      // Fall back to ilike on title/description for safety
      const q = `%${search.replace(/%/g, '')}%`
      query = query.or(`title.ilike.${q},description.ilike.${q}`)
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'rating':
        query = query.order('average_rating', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      default:
        // newest
        query = query.order('created_at', { ascending: false })
        break
    }

    const start = (page - 1) * per_page
    const end = start + per_page - 1

    const { data: products, error, count } = await query.range(start, end)

    if (error) {
      console.error('Error fetching products', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const meta = {
      total: typeof count === 'number' ? count : (products || []).length,
      page,
      per_page,
      total_pages: Math.ceil((typeof count === 'number' ? count : (products || []).length) / per_page),
    }

    return NextResponse.json({ items: products || [], meta })
  } catch (err) {
    console.error('Products list GET error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
