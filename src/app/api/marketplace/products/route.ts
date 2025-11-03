// Public API to fetch marketplace products (no auth required)
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getUserAvatarUrl } from '@/lib/avatar-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Query parameters
    const searchQuery = searchParams.get('q') || '';
    const categories = searchParams.getAll('category');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const featuredOnly = searchParams.get('featuredOnly') === 'true';
    const onSaleOnly = searchParams.get('onSaleOnly') === 'true';
    const freeShippingOnly = searchParams.get('freeShippingOnly') === 'true';
    const freeListingsOnly = searchParams.get('freeListingsOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'created_at_desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = admin.firestore();
    
    // Start with base query - only active products
    let query = db.collection('products')
      .where('status', '==', 'active');

    // Apply category filter
    if (categories.length > 0 && !categories.includes('all')) {
      query = query.where('category_id', 'in', categories) as any;
    }

    // Apply featured filter
    if (featuredOnly) {
      query = query.where('featured', '==', true) as any;
    }

    // Apply free listings filter
    if (freeListingsOnly) {
      query = query.where('listing_type', '==', 'freebie') as any;
    }

    // Apply on sale filter (assuming products with discount > 0)
    if (onSaleOnly) {
      query = query.where('discount', '>', 0) as any;
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.orderBy('price', 'asc') as any;
        break;
      case 'price_desc':
        query = query.orderBy('price', 'desc') as any;
        break;
      case 'rating_desc':
        query = query.orderBy('average_rating', 'desc') as any;
        break;
      case 'created_at_desc':
      default:
        query = query.orderBy('created_at', 'desc') as any;
        break;
    }

    // Apply pagination
    const snapshot = await query.limit(limit + 1).offset(offset).get();

    const hasMore = snapshot.docs.length > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

    let products = await Promise.all(docs.map(async (doc) => {
      const data = doc.data();
      
      // Fetch seller details
      let sellerDetails: any = null;
      if (data.seller_id) {
        try {
          const sellerDoc = await db.collection('users').doc(data.seller_id).get();
          if (sellerDoc.exists) {
            const sellerData = sellerDoc.data();
            const sellerName = sellerData?.full_name || sellerData?.display_name || sellerData?.email || 'Anonymous';
            
            sellerDetails = {
              id: sellerDoc.id,
              name: sellerName,
              // Read profile_picture_url directly from users collection
              avatar: getUserAvatarUrl(
                sellerDoc.id,
                sellerData?.profile_picture_url || sellerData?.avatar_url,
                sellerName
              ),
              location: `${sellerData?.city || ''}, ${sellerData?.country || ''}`.replace(/^, |, $/g, ''),
              verified: sellerData?.verification_status === 'verified' || sellerData?.kyc_verified === true,
              rating: sellerData?.seller_rating || 0,
              totalSales: sellerData?.seller_stats?.total_sales || 0,
              memberSince: sellerData?.created_at?.toDate?.()?.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
              }) || 'Recently',
            };
          }
        } catch (err) {
          console.error('Error fetching seller:', err);
        }
      }

      // Fetch category name if category_id exists
      let categoryName = '';
      if (data.category_id) {
        try {
          const categoryDoc = await db.collection('categories').doc(data.category_id).get();
          if (categoryDoc.exists) {
            const categoryData = categoryDoc.data();
            categoryName = categoryData?.name || '';
          }
        } catch (err) {
          console.error('Error fetching category:', err);
        }
      }

      return {
        id: doc.id,
        seller_id: data.seller_id,
        title: data.title,
        description: data.description,
        price: data.price || 0,
        currency: data.currency || 'GBP',
        category_id: data.category_id,
        listing_type: data.listing_type || 'sale',
        status: data.status,
        images: data.images || [],
        location_text: data.location_text || '',
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        quantity_available: data.quantity_available || 0,
        specifications: data.specifications || {},
        shipping_policy: data.shipping_policy || {},
        average_rating: data.average_rating || 0,
        review_count: data.review_count || 0,
        tags: data.tags || [],
        
        // Mapped fields for compatibility
        name: data.title,
        originalPrice: data.original_price,
        rating: data.average_rating || 0,
        reviews: data.review_count || 0,
        seller: sellerDetails?.name || 'Anonymous',
        sellerVerified: sellerDetails?.verified || false,
        // Extract URL from image object: {url, alt, order, is_primary}
        image: data.images?.[0]?.url || (typeof data.images?.[0] === 'string' ? data.images[0] : '') || '',
        category: categoryName || '',
        featured: data.featured || false,
        discount: data.discount || 0,
        isFree: data.listing_type === 'freebie',
        stockCount: data.quantity_available || 0,
        sellerDetails: sellerDetails,
      };
    }));

    // Apply client-side filters (for complex filters not supported by Firestore)
    
    // Search query filter
    if (searchQuery.length >= 3) {
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term);
      products = products.filter(p => {
        const productText = [
          p.title,
          p.description,
          p.seller,
          p.category,
          ...(p.tags || [])
        ].join(' ').toLowerCase();

        return searchTerms.some(term => productText.includes(term));
      });
    }

    // Price range filter
    if (minPrice !== null) {
      products = products.filter(p => p.price >= minPrice);
    }
    if (maxPrice !== null) {
      products = products.filter(p => p.price <= maxPrice);
    }

    // Verified sellers only filter
    if (verifiedOnly) {
      products = products.filter(p => p.sellerVerified === true);
    }

    // Free shipping filter (assuming shipping_policy.free_shipping exists)
    if (freeShippingOnly) {
      products = products.filter(p => p.shipping_policy?.free_shipping === true);
    }

    return NextResponse.json({
      products,
      total: products.length,
      hasMore,
      offset,
      limit,
    });

  } catch (error: any) {
    console.error('Error fetching marketplace products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}
