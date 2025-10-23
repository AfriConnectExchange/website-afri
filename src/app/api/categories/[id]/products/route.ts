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

    // Return empty array instead of null
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Category products GET error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
