
// API Route to create a new product
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { Product, CreateProductFormData } from '@/lib/productTypes';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const sellerId = decodedToken.uid;
    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.description || !body.category_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = admin.firestore();

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Create product object - NO DENORMALIZED SELLER DATA
    const basePrice = typeof body.price === 'number' ? body.price : Number(body.price);

    if (body.listing_type !== 'freebie' && (!Number.isFinite(basePrice) || basePrice < 0)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }
    
    // Set status to 'pending_review' so admins can approve it
    const status = 'pending_review';

    const product: Omit<Product, 'id'> = {
      // Identity & Relations
      seller_id: sellerId,
      category_id: body.category_id,
      
      // Core Product Info
      title: body.title,
      description: body.description,
      product_type: body.product_type || 'product',
      
      // Pricing
      listing_type: body.listing_type || 'sale',
      price: body.listing_type === 'freebie' ? 0 : basePrice,
      currency: body.currency || 'GBP',
      
      // Barter
      accepts_barter: body.accepts_barter || body.listing_type === 'barter',
      barter_preferences: body.barter_preferences,
      
      // Inventory
      quantity_available: body.quantity_available,
      condition: body.condition,
      
      // Media
      images: Array.isArray(body.images) ? body.images.map((img: any, index: number) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: body.title,
        order: index,
        is_primary: index === 0,
      })) : [],
      video_url: body.video_url,
      
      // Specifications
      specifications: body.specifications,
      
      // Location
      location: body.location,
      location_text: `${body.location.city || ''}, ${body.location.country || ''}`.trim().replace(/^,|,$/g, ''),
      
      // Shipping - new detailed structure
      shipping_options: body.shipping_options || [],
      package_details: body.package_details || {}, // weight, dimensions
      is_local_pickup_only: body.is_local_pickup_only || false,
      ships_internationally: body.ships_internationally || false,
      
      // Status
      status: status,
      
      // Engagement
      view_count: 0,
      favorite_count: 0,
      review_count: 0,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: undefined,
      
      // SEO
      slug: slug,
      search_keywords: [
        ...body.title.toLowerCase().split(' '),
        ...(body.tags || []).map((t: string) => t.toLowerCase()),
        body.category_id,
      ],
    };

    const productRef = await db.collection('products').add(product);

    await logActivity({
      user_id: sellerId,
      action: 'product_created',
      entity_type: 'product',
      entity_id: productRef.id,
      changes: { title: body.title, status: status },
    });

    return NextResponse.json({
      success: true,
      product_id: productRef.id,
      message: 'Product submitted for review. It will be live once approved.',
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
