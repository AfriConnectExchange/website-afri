/**
 * Nearby Products API - Location-based product discovery
 * GET /api/products/nearby?lat={latitude}&lng={longitude}&radius={km}&...filters
 */

import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { rankProducts, calculateCategoryAveragePrices } from '@/lib/product-ranking';
import type { Product } from '@/lib/productTypes';
import type { Coordinates } from '@/lib/geolocation';

const db = admin.firestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Required: User location
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'User location (lat, lng) is required' },
        { status: 400 }
      );
    }

    const userLocation: Coordinates = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    // Validate coordinates
    if (
      isNaN(userLocation.lat) ||
      isNaN(userLocation.lng) ||
      userLocation.lat < -90 ||
      userLocation.lat > 90 ||
      userLocation.lng < -180 ||
      userLocation.lng > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Optional filters
    const radius = parseFloat(searchParams.get('radius') || '25'); // Default 25km
    const categoryId = searchParams.get('category_id');
    const listingType = searchParams.get('listing_type'); // 'sale', 'barter', 'freebie'
    const minPrice = searchParams.get('min_price')
      ? parseFloat(searchParams.get('min_price')!)
      : undefined;
    const maxPrice = searchParams.get('max_price')
      ? parseFloat(searchParams.get('max_price')!)
      : undefined;
    const searchQuery = searchParams.get('q') || searchParams.get('query');
    const sortBy = searchParams.get('sort_by') || 'ranking'; // 'ranking', 'distance', 'price', 'rating', 'newest'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build Firestore query
    let query = db.collection('products')
      .where('status', '==', 'active');

    // Apply category filter
    if (categoryId) {
      query = query.where('category_id', '==', categoryId);
    }

    // Apply listing type filter
    if (listingType && ['sale', 'barter', 'freebie'].includes(listingType)) {
      query = query.where('listing_type', '==', listingType);
    }

    // Apply price filters
    if (minPrice !== undefined) {
      query = query.where('price', '>=', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.where('price', '<=', maxPrice);
    }

    // Fetch products
    const snapshot = await query.get();
    let products: Product[] = [];

    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
      } as Product);
    });

    // Filter by radius (client-side since Firestore doesn't support geo queries natively)
    // In production, use geohash for efficient filtering
    products = products.filter((product) => {
      if (
        !product.location?.coordinates?.lat ||
        !product.location?.coordinates?.lng
      ) {
        return false; // Exclude products without location
      }

      // Calculate distance
      const distance = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        product.location.coordinates.lat,
        product.location.coordinates.lng
      );

      return distance <= radius;
    });

    // Calculate category average prices for ranking
    const categoryAveragePrices = calculateCategoryAveragePrices(products);

    // Rank products using multi-factor algorithm
    let rankedProducts = rankProducts(
      products,
      userLocation,
      searchQuery || undefined,
      categoryAveragePrices
    );

    // Apply sorting
    if (sortBy !== 'ranking') {
      rankedProducts = applySorting(rankedProducts, sortBy);
    }

    // Pagination
    const total = rankedProducts.length;
    const paginatedProducts = rankedProducts.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        products: paginatedProducts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        userLocation,
        filters: {
          radius,
          categoryId,
          listingType,
          minPrice,
          maxPrice,
          searchQuery,
          sortBy,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Nearby products API error:', error);
    return NextResponse.json(
      { error: 'Unable to fetch nearby products' },
      { status: 500 }
    );
  }
}

/**
 * Calculate distance using Haversine formula
 */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Apply sorting other than ranking
 */
function applySorting(products: any[], sortBy: string): any[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'distance':
      return sorted.sort(
        (a, b) => (a.distanceFromUser || 999) - (b.distanceFromUser || 999)
      );
    case 'price':
      return sorted.sort((a, b) => a.price - b.price);
    case 'rating':
      return sorted.sort(
        (a, b) => (b.average_rating || 0) - (a.average_rating || 0)
      );
    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    default:
      return sorted;
  }
}
