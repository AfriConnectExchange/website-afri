/**
 * Product Ranking Algorithm for AfriConnect Exchange
 * Multi-factor scoring system prioritizing distance, relevance, seller rating, freshness, and price
 */

import { calculateDistance, type Coordinates } from './geolocation';
import type { Product } from '@/lib/productTypes';

export interface RankingFactors {
  distanceScore: number;     // 40% weight
  relevanceScore: number;    // 30% weight
  sellerRatingScore: number; // 15% weight
  freshnessScore: number;    // 10% weight
  priceScore: number;        // 5% weight
}

export interface RankedProduct extends Product {
  distanceFromUser?: number;  // in km
  rankingScore: number;       // 0-100
  rankingFactors?: RankingFactors;
}

const RANKING_WEIGHTS = {
  distance: 0.40,
  relevance: 0.30,
  sellerRating: 0.15,
  freshness: 0.10,
  price: 0.05,
};

/**
 * Calculate overall ranking score for a product
 * @param product Product to rank
 * @param userLocation User's current coordinates
 * @param searchQuery Optional search keyword
 * @param categoryAveragePrices Optional map of category IDs to average prices
 * @returns Ranked product with score
 */
export function rankProduct(
  product: Product,
  userLocation: Coordinates | null,
  searchQuery?: string,
  categoryAveragePrices?: Map<string, number>
): RankedProduct {
  const factors: RankingFactors = {
    distanceScore: calculateDistanceScore(product, userLocation),
    relevanceScore: calculateRelevanceScore(product, searchQuery),
    sellerRatingScore: calculateSellerScore(product),
    freshnessScore: calculateFreshnessScore(product),
    priceScore: calculatePriceScore(product, categoryAveragePrices),
  };

  const rankingScore =
    factors.distanceScore * RANKING_WEIGHTS.distance +
    factors.relevanceScore * RANKING_WEIGHTS.relevance +
    factors.sellerRatingScore * RANKING_WEIGHTS.sellerRating +
    factors.freshnessScore * RANKING_WEIGHTS.freshness +
    factors.priceScore * RANKING_WEIGHTS.price;

  // Calculate actual distance if location available
  let distanceFromUser: number | undefined;
  if (
    userLocation &&
    product.location?.coordinates?.lat &&
    product.location?.coordinates?.lng
  ) {
    distanceFromUser = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      product.location.coordinates.lat,
      product.location.coordinates.lng
    );
  }

  return {
    ...product,
    distanceFromUser,
    rankingScore: Math.round(rankingScore * 10) / 10, // Round to 1 decimal
    rankingFactors: factors,
  };
}

/**
 * Rank multiple products and sort by score
 * @param products Array of products to rank
 * @param userLocation User's current coordinates
 * @param searchQuery Optional search keyword
 * @param categoryAveragePrices Optional map of category IDs to average prices
 * @returns Sorted array of ranked products
 */
export function rankProducts(
  products: Product[],
  userLocation: Coordinates | null,
  searchQuery?: string,
  categoryAveragePrices?: Map<string, number>
): RankedProduct[] {
  const ranked = products.map((product) =>
    rankProduct(product, userLocation, searchQuery, categoryAveragePrices)
  );

  // Sort by ranking score (highest first)
  return ranked.sort((a, b) => b.rankingScore - a.rankingScore);
}

/**
 * Calculate distance score (40% weight)
 * Closer products get higher scores
 */
function calculateDistanceScore(
  product: Product,
  userLocation: Coordinates | null
): number {
  // No location data = lowest priority
  if (
    !userLocation ||
    !product.location?.coordinates?.lat ||
    !product.location?.coordinates?.lng
  ) {
    return 0;
  }

  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    product.location.coordinates.lat,
    product.location.coordinates.lng
  );

  // Scoring curve: closer = higher score
  if (distance <= 5) return 100;   // Within 5km: perfect score
  if (distance <= 10) return 90;   // 5-10km: excellent
  if (distance <= 20) return 70;   // 10-20km: good
  if (distance <= 50) return 40;   // 20-50km: moderate
  return 10;                        // >50km: low priority
}

/**
 * Calculate relevance score (30% weight)
 * Products matching search query get higher scores
 */
function calculateRelevanceScore(
  product: Product,
  searchQuery?: string
): number {
  if (!searchQuery || searchQuery.length < 3) {
    return 50; // Neutral score when no search query
  }

  const query = searchQuery.toLowerCase().trim();
  let score = 0;

  // Exact title match: 100 points
  if (product.title.toLowerCase().includes(query)) {
    score += 100;
  }

  // Tag match: 70 points per matching tag
  if (product.tags && Array.isArray(product.tags)) {
    const matchingTags = product.tags.filter((tag) =>
      tag.toLowerCase().includes(query)
    );
    score += matchingTags.length * 70;
  }

  // Description match: 40 points
  if (product.description.toLowerCase().includes(query)) {
    score += 40;
  }

  // Category match: 60 points
  if (product.category_id && product.category_id.toLowerCase().includes(query)) {
    score += 60;
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Calculate seller rating score (15% weight)
 * Verified sellers with high ratings get higher scores
 */
function calculateSellerScore(product: Product): number {
  // Unverified sellers get low priority
  const isVerified = product.seller_verified || false;
  if (!isVerified) {
    return 30;
  }

  const rating = product.average_rating || 0;
  const reviewCount = product.review_count || 0;

  // Base score from rating (0-5 stars → 0-100 points)
  let score = (rating / 5) * 100;

  // Boost for high review count (credibility)
  if (reviewCount >= 100) score += 10;
  else if (reviewCount >= 50) score += 5;
  else if (reviewCount >= 10) score += 2;

  return Math.min(score, 100);
}

/**
 * Calculate freshness score (10% weight)
 * Newer listings get higher scores
 */
function calculateFreshnessScore(product: Product): number {
  const now = Date.now();
  const createdAt = new Date(product.created_at).getTime();

  // Handle invalid dates
  if (isNaN(createdAt)) {
    return 50; // Neutral score
  }

  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

  if (ageInDays <= 1) return 100;      // Less than 1 day: new!
  if (ageInDays <= 7) return 80;       // Less than 1 week: recent
  if (ageInDays <= 30) return 50;      // Less than 1 month: moderate
  if (ageInDays <= 90) return 20;      // Less than 3 months: aging
  return 5;                             // Older than 3 months: stale
}

/**
 * Calculate price competitiveness score (5% weight)
 * Free listings and good deals get higher scores
 */
function calculatePriceScore(
  product: Product,
  categoryAveragePrices?: Map<string, number>
): number {
  // Free listings get maximum priority
  if (product.listing_type === 'freebie' || product.price === 0) {
    return 100;
  }

  // Barter gets high priority
  if (product.listing_type === 'barter') {
    return 70;
  }

  // For sale listings: compare to category average
  const categoryId = product.category_id || '';
  const categoryAvgPrice = categoryAveragePrices?.get(categoryId);

  if (!categoryAvgPrice || categoryAvgPrice === 0) {
    return 50; // Neutral if no comparison data
  }

  const ratio = product.price / categoryAvgPrice;

  if (ratio <= 0.7) return 100;        // 30%+ below average: great deal
  if (ratio <= 0.9) return 80;         // 10-30% below average: good deal
  if (ratio <= 1.1) return 50;         // Within ±10%: fair price
  if (ratio <= 1.3) return 30;         // 10-30% above average: expensive
  return 10;                            // >30% above average: overpriced
}

/**
 * Filter products within a specific radius
 * @param products Array of products with location data
 * @param userLocation User's current coordinates
 * @param radiusKm Maximum distance in kilometers
 * @returns Filtered products within radius
 */
export function filterByRadius(
  products: Product[],
  userLocation: Coordinates,
  radiusKm: number
): Product[] {
  return products.filter((product) => {
    if (
      !product.location?.coordinates?.lat ||
      !product.location?.coordinates?.lng
    ) {
      return false;
    }

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      product.location.coordinates.lat,
      product.location.coordinates.lng
    );

    return distance <= radiusKm;
  });
}

/**
 * Calculate category average prices for price scoring
 * @param products Array of all products
 * @returns Map of category IDs to average prices
 */
export function calculateCategoryAveragePrices(
  products: Product[]
): Map<string, number> {
  const categoryTotals = new Map<string, { sum: number; count: number }>();

  // Calculate sums and counts
  products.forEach((product) => {
    if (
      product.listing_type === 'sale' &&
      product.price > 0 &&
      product.category_id
    ) {
      const existing = categoryTotals.get(product.category_id) || {
        sum: 0,
        count: 0,
      };
      categoryTotals.set(product.category_id, {
        sum: existing.sum + product.price,
        count: existing.count + 1,
      });
    }
  });

  // Calculate averages
  const averages = new Map<string, number>();
  categoryTotals.forEach((value, categoryId) => {
    averages.set(categoryId, value.sum / value.count);
  });

  return averages;
}
