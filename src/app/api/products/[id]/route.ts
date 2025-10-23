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
      const p = byId[0];
      // Enrich with seller and category
      const { data: sellerData } = await supabase
        .from('users')
        .select('id, full_name, display_name, username, email, profile_picture_url')
        .eq('id', p.seller_id)
        .limit(1)

      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', p.category_id)
        .limit(1)

      const seller = sellerData && sellerData.length > 0 ? sellerData[0] : null;
      const category = categoryData && categoryData.length > 0 ? categoryData[0] : null;

      const normalized = {
        id: p.id,
        title: p.title,
        name: p.title || p.name || 'Untitled Product',
        description: p.description,
        price: p.price !== null && p.price !== undefined ? Number(p.price) : 0,
        currency: p.currency || 'GBP',
        isFree: !!p.is_free,
        quantity_available: p.quantity_available ?? 0,
        stockCount: p.quantity_available ?? p.stockCount ?? 0,
        images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
        tags: p.tags || [],
        average_rating: p.average_rating !== null && p.average_rating !== undefined ? Number(p.average_rating) : 0,
        review_count: p.review_count ?? 0,
        created_at: p.created_at,
        updated_at: p.updated_at,
        seller_id: p.seller_id,
  seller_name: seller ? (seller.full_name || seller.display_name || seller.username || seller.email) : null,
  seller_avatar: seller ? seller.profile_picture_url : null,
        category_id: p.category_id,
        category_name: category ? category.name : null,
      };

      return NextResponse.json(normalized)
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
