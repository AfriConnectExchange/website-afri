'use server';
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Using 'any' for context to avoid Next's Promise<params> typing mismatch in this repo setup
export async function GET(_req: NextRequest, context: any) {
  const params = typeof context?.params?.then === 'function' ? await context.params : context.params
  const { id } = params || {}

  try {
    const supabase = await createServerClient()

    // Try to treat id as slug first, then as uuid category id.
    // Special-case the 'all' route: return all active products (no category filter).
    const { data: catBySlug } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', id)
      .limit(1)

    const categoryId = catBySlug && catBySlug[0]?.id ? catBySlug[0].id : id

    // Build the products query and only apply category filter when we have a real id
    let productsQuery: any = supabase
      .from('products')
      .select('id, seller_id, title, slug, description, price, currency, images, tags, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // If the route param is not the literal string 'all' and we have a category id, filter by it
    if (categoryId && categoryId !== 'all') {
      productsQuery = productsQuery.eq('category_id', categoryId)
    }

    const { data, error } = await productsQuery

    if (error) {
      console.error('Error fetching products for category', id, error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // If no products, return empty array
    const products = data ?? [];

    // Collect seller and category ids to enrich the product objects
    const sellerIds = Array.from(new Set(products.map((p: any) => p.seller_id).filter(Boolean)));
    const categoryIds = Array.from(new Set(products.map((p: any) => p.category_id).filter(Boolean)));

    // Fetch sellers and categories in batch
    const { data: sellers } = await supabase
      .from('users')
      .select('id, full_name, display_name, username, email, profile_picture_url')
      .in('id', sellerIds || [])

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds || [])

    const sellerMap = (sellers || []).reduce((acc: any, s: any) => { acc[s.id] = s; return acc; }, {});
    const categoryMap = (categoriesData || []).reduce((acc: any, c: any) => { acc[c.id] = c; return acc; }, {});

    // Normalize/mapping for client
    const normalized = (products || []).map((p: any) => ({
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
  seller_name: sellerMap[p.seller_id] ? (sellerMap[p.seller_id].full_name || sellerMap[p.seller_id].display_name || sellerMap[p.seller_id].username || sellerMap[p.seller_id].email) : null,
  seller_avatar: sellerMap[p.seller_id] ? (sellerMap[p.seller_id].profile_picture_url || null) : null,
      category_id: p.category_id,
      category_name: categoryMap[p.category_id] ? categoryMap[p.category_id].name : null,
    }));

    return NextResponse.json(normalized)
  } catch (err) {
    console.error('Category products GET error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
