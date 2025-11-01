// Public API to fetch single product by ID (no auth required)
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const db = admin.firestore();
    const productDoc = await db.collection('products').doc(id).get();

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const data = productDoc.data();
    
    // Fetch seller details
    let sellerDetails: any = null;
    if (data?.seller_id) {
      try {
        const sellerDoc = await db.collection('users').doc(data.seller_id).get();
        if (sellerDoc.exists) {
          const sellerData = sellerDoc.data();
          sellerDetails = {
            id: sellerDoc.id,
            name: sellerData?.display_name || sellerData?.email || 'Anonymous',
            verified: sellerData?.kyc_verified === true,
            rating: sellerData?.seller_rating || 0,
          };
        }
      } catch (err) {
        console.error('Error fetching seller:', err);
      }
    }

    const product = {
      id: productDoc.id,
      seller_id: data?.seller_id,
      title: data?.title,
      description: data?.description,
      price: data?.price || 0,
      currency: data?.currency || 'GBP',
      category_id: data?.category_id,
      listing_type: data?.listing_type || 'sale',
      status: data?.status,
      images: data?.images || [],
      location_text: data?.location_text || '',
      created_at: data?.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      quantity_available: data?.quantity_available || 0,
      specifications: data?.specifications || {},
      shipping_policy: data?.shipping_policy || {},
      average_rating: data?.average_rating || 0,
      review_count: data?.review_count || 0,
      tags: data?.tags || [],
      
      // Mapped fields for compatibility
      name: data?.title,
      originalPrice: data?.original_price,
      rating: data?.average_rating || 0,
      reviews: data?.review_count || 0,
      seller: sellerDetails?.name || 'Anonymous',
      sellerVerified: sellerDetails?.verified || false,
      image: data?.images?.[0] || '',
      category: data?.category_name || '',
      featured: data?.featured || false,
      discount: data?.discount || 0,
      isFree: data?.listing_type === 'freebie',
      stockCount: data?.quantity_available || 0,
      sellerDetails: sellerDetails,
    };

    return NextResponse.json({ product });

  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error.message },
      { status: 500 }
    );
  }
}
