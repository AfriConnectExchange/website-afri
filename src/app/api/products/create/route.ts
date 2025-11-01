// API Route to create a new product
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { Product, CreateProductFormData } from '@/lib/productTypes';

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
    const body: CreateProductFormData = await req.json();

    // Validate required fields
    if (!body.title || !body.description || !body.category_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = admin.firestore();

    // Get seller info from users collection
    const sellerDoc = await db.collection('users').doc(sellerId).get();
    const sellerData = sellerDoc.data();

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Create product object
    const product: Omit<Product, 'id'> = {
      seller_id: sellerId,
      
      // Basic info
      title: body.title,
      description: body.description,
      product_type: body.product_type,
      
      // Category
      category_id: body.category_id,
      tags: body.tags || [],
      
      // Listing & pricing
      listing_type: body.listing_type,
      price: body.listing_type === 'freebie' ? 0 : body.price,
      currency: body.currency || 'GBP',
      barter_preferences: body.barter_preferences,
      
      // Inventory
      quantity_available: body.quantity_available,
      sku: body.sku,
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
      location_text: `${body.location.city || ''}${body.location.city && body.location.country ? ', ' : ''}${body.location.country}`,
      
      // Shipping
      shipping_policy: body.shipping_policy,
      is_local_pickup_only: body.is_local_pickup_only || false,
      
      // Status
      status: body.status || 'draft',
      
      // Seller info (denormalized)
      seller_name: sellerData?.full_name || sellerData?.email || 'Unknown',
      seller_avatar: sellerData?.profile_picture_url,
      seller_verified: sellerData?.verification_status === 'verified',
      
      // Engagement
      view_count: 0,
      favorite_count: 0,
      review_count: 0,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: body.status === 'active' ? new Date().toISOString() : undefined,
      
      // SEO
      slug: slug,
      search_keywords: [
        ...body.title.toLowerCase().split(' '),
        ...body.tags.map(t => t.toLowerCase()),
        body.category_id,
      ],
    };

    // Add product to Firestore
    const productRef = await db.collection('products').add(product);

    // Update category product count
    const categoryRef = db.collection('categories').doc(body.category_id);
    await categoryRef.update({
      product_count: admin.firestore.FieldValue.increment(1),
    });

    return NextResponse.json({
      success: true,
      product_id: productRef.id,
      message: body.status === 'active' ? 'Product published successfully!' : 'Product saved as draft',
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
