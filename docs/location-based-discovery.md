# Location-Based Product Discovery System
## AfriConnect Exchange - Technical Specification

---

## 1. Overview

This document specifies the location-based product discovery algorithm that enables users to find products and services based on their geographical proximity. The system addresses **US014-US017** (Marketplace Search & Filters) and supports all **Epic 3** user stories by enabling location-aware transactions.

### 1.1 Goals
- Display products sorted by proximity to the user's current location
- Enable sellers to specify pickup/delivery radius during listing creation
- Provide distance-based filtering (0-50km radius)
- Calculate and display distance on product cards
- Support local pickup and delivery radius preferences
- Rank products using multi-factor algorithm (distance, relevance, seller rating, freshness, price)

---

## 2. Location Data Collection

### 2.1 User Location Capture
**When**: On marketplace page load, user can grant permission for geolocation access.

**Methods**:
1. **Browser Geolocation API** (Primary)
   - `navigator.geolocation.getCurrentPosition()`
   - Accuracy: 10-50 meters (urban), 100-500 meters (rural)
   - Fallback: IP-based geolocation

2. **Manual Entry** (Secondary)
   - City/postcode selection
   - Geocode to coordinates using Google Maps API or Mapbox

3. **Profile Default** (Tertiary)
   - Use saved address from user profile
   - Coordinates stored in `users.location.coordinates`

### 2.2 Seller Location Collection
**When**: During product listing creation.

**Required Fields**:
```typescript
interface ProductLocation {
  address: string;           // Full street address
  city: string;              // City/town
  region?: string;           // State/Province/County
  country: string;           // ISO country code (e.g., "GB", "NG")
  postal_code?: string;      // Zip/postcode
  coordinates: {
    lat: number;             // Latitude (-90 to 90)
    lng: number;             // Longitude (-180 to 180)
  };
  delivery_radius_km: number; // Max delivery distance (0-50km)
  pickup_available: boolean;  // Allow local pickup
}
```

**Validation Rules**:
- Address ≥ 10 characters
- City ≥ 2 characters
- Country must be valid ISO code
- Coordinates validated: `-90 ≤ lat ≤ 90`, `-180 ≤ lng ≤ 180`
- `delivery_radius_km` between 0-50
- Auto-geocode address to coordinates using Geocoding API

---

## 3. Distance Calculation Algorithm

### 3.1 Haversine Formula
Calculate great-circle distance between two coordinate pairs.

```typescript
/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

### 3.2 Distance Display Rules
- **< 1 km**: Show in meters (e.g., "350m away")
- **1-10 km**: Show 1 decimal (e.g., "3.2 km away")
- **> 10 km**: Show integer (e.g., "24 km away")
- **> 50 km**: Show city/region only (e.g., "Manchester, UK")
- **Unknown**: Show "Location not available"

---

## 4. Product Ranking Algorithm (FR02)

### 4.1 Multi-Factor Scoring
Products are ranked using a weighted score combining 5 factors:

```typescript
interface RankingFactors {
  distanceScore: number;      // 40% weight
  relevanceScore: number;     // 30% weight
  sellerRatingScore: number;  // 15% weight
  freshnessScore: number;     // 10% weight
  priceScore: number;         // 5% weight
}

function calculateProductScore(
  product: Product,
  userLocation: Coordinates,
  searchQuery?: string
): number {
  const weights = {
    distance: 0.40,
    relevance: 0.30,
    sellerRating: 0.15,
    freshness: 0.10,
    price: 0.05
  };
  
  const distance = calculateDistanceScore(product, userLocation);
  const relevance = calculateRelevanceScore(product, searchQuery);
  const sellerRating = calculateSellerScore(product);
  const freshness = calculateFreshnessScore(product);
  const price = calculatePriceScore(product);
  
  return (
    distance * weights.distance +
    relevance * weights.relevance +
    sellerRating * weights.sellerRating +
    freshness * weights.freshness +
    price * weights.price
  );
}
```

### 4.2 Distance Score (40% weight)
```typescript
function calculateDistanceScore(
  product: Product, 
  userLocation: Coordinates
): number {
  if (!product.location?.coordinates || !userLocation) {
    return 0; // No location data = lowest priority
  }
  
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    product.location.coordinates.lat,
    product.location.coordinates.lng
  );
  
  // Scoring curve: closer = higher score
  if (distance <= 5) return 100;        // Within 5km: perfect score
  if (distance <= 10) return 90;        // 5-10km: excellent
  if (distance <= 20) return 70;        // 10-20km: good
  if (distance <= 50) return 40;        // 20-50km: moderate
  return 10;                             // >50km: low priority
}
```

### 4.3 Relevance Score (30% weight)
```typescript
function calculateRelevanceScore(
  product: Product, 
  searchQuery?: string
): number {
  if (!searchQuery || searchQuery.length < 3) {
    return 50; // Neutral score when no search query
  }
  
  const query = searchQuery.toLowerCase();
  let score = 0;
  
  // Exact title match: 100 points
  if (product.title.toLowerCase().includes(query)) {
    score += 100;
  }
  
  // Tag match: 70 points per tag
  const matchingTags = product.tags.filter(tag => 
    tag.toLowerCase().includes(query)
  );
  score += matchingTags.length * 70;
  
  // Description match: 40 points
  if (product.description.toLowerCase().includes(query)) {
    score += 40;
  }
  
  // Category match: 60 points
  if (product.category?.toLowerCase().includes(query)) {
    score += 60;
  }
  
  return Math.min(score, 100); // Cap at 100
}
```

### 4.4 Seller Rating Score (15% weight)
```typescript
function calculateSellerScore(product: Product): number {
  if (!product.seller_verified) {
    return 30; // Unverified sellers get low priority
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
```

### 4.5 Freshness Score (10% weight)
```typescript
function calculateFreshnessScore(product: Product): number {
  const now = Date.now();
  const createdAt = new Date(product.created_at).getTime();
  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  
  if (ageInDays <= 1) return 100;      // Less than 1 day: new!
  if (ageInDays <= 7) return 80;       // Less than 1 week: recent
  if (ageInDays <= 30) return 50;      // Less than 1 month: moderate
  if (ageInDays <= 90) return 20;      // Less than 3 months: aging
  return 5;                             // Older than 3 months: stale
}
```

### 4.6 Price Competitiveness Score (5% weight)
```typescript
function calculatePriceScore(product: Product): number {
  // For free listings (gifters)
  if (product.listing_type === 'freebie') {
    return 100; // Maximum priority
  }
  
  // For barter
  if (product.listing_type === 'barter') {
    return 70; // High priority for unique trades
  }
  
  // For sale listings: compare to category average
  const categoryAvgPrice = getCategoryAveragePrice(product.category_id);
  
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
```

---

## 5. Marketplace Filtering UI

### 5.1 Location Filter Panel
```typescript
interface LocationFilters {
  useCurrentLocation: boolean;      // Auto-detect via geolocation
  manualLocation?: {
    city: string;
    postcode?: string;
  };
  maxDistance: number;              // In kilometers (0-50)
  localPickupOnly: boolean;         // Show only pickup-enabled listings
  deliveryAvailable: boolean;       // Show only delivery-enabled listings
}
```

### 5.2 UI Components
1. **Current Location Button**
   - "Use My Location" button with geolocation icon
   - Shows loading spinner while fetching coordinates
   - Displays detected city/postcode after success
   - Error state: "Unable to detect location. Enter manually."

2. **Distance Slider**
   - Range: 0-50 km
   - Default: 25 km
   - Marks at: 5km, 10km, 25km, 50km
   - Label: "Show products within [X] km"

3. **Manual Location Entry**
   - City dropdown (populated from database)
   - Postcode input field
   - "Search" button to geocode and apply

4. **Delivery Options Checkboxes**
   - ☐ Local pickup available
   - ☐ Delivery available
   - ☐ Show all options (default)

---

## 6. Product Card Enhancements

### 6.1 Distance Badge
Display on every product card:
```tsx
<div className="flex items-center gap-1 text-sm text-gray-600">
  <MapPin className="w-4 h-4" />
  <span>{formatDistance(product.distanceFromUser)}</span>
</div>
```

### 6.2 "Nearby" Tag
For products within 5km:
```tsx
{product.distanceFromUser <= 5 && (
  <Badge variant="success" className="absolute top-2 right-2">
    <Navigation className="w-3 h-3 mr-1" />
    Nearby
  </Badge>
)}
```

### 6.3 Delivery Options Icons
```tsx
<div className="flex gap-2">
  {product.location.pickup_available && (
    <Tooltip content="Local pickup available">
      <Package className="w-4 h-4 text-brand-progress-blue" />
    </Tooltip>
  )}
  
  {product.location.delivery_radius_km > 0 && (
    <Tooltip content={`Delivers within ${product.location.delivery_radius_km}km`}>
      <Truck className="w-4 h-4 text-brand-growth-green" />
    </Tooltip>
  )}
</div>
```

---

## 7. API Endpoints

### 7.1 GET `/api/products/nearby`
**Purpose**: Fetch products ranked by distance from user location.

**Query Parameters**:
```typescript
{
  lat: number;              // User latitude
  lng: number;              // User longitude
  radius?: number;          // Max distance in km (default: 25)
  category_id?: string;     // Filter by category
  listing_type?: string;    // 'sale' | 'barter' | 'freebie'
  min_price?: number;
  max_price?: number;
  sort_by?: 'distance' | 'price' | 'rating' | 'newest';
  limit?: number;           // Results per page (default: 20)
  offset?: number;          // Pagination offset
}
```

**Response**:
```typescript
{
  success: true,
  products: Product[],      // Sorted by ranking score
  pagination: {
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean
  },
  userLocation: {
    lat: number,
    lng: number,
    city?: string
  }
}
```

### 7.2 POST `/api/products`
**Purpose**: Create new product listing with location data.

**Body**:
```typescript
{
  title: string;
  description: string;
  price: number;
  category_id: string;
  images: string[];
  location: {
    address: string;
    city: string;
    region?: string;
    country: string;
    postal_code?: string;
    // Coordinates auto-geocoded from address
    delivery_radius_km: number;
    pickup_available: boolean;
  };
  // ... other product fields
}
```

**Geocoding Process**:
1. Validate address fields
2. Call Geocoding API (Google Maps or Mapbox)
3. Extract `lat` and `lng` from response
4. Store coordinates in `location.coordinates`
5. Handle geocoding failures gracefully (use city-level coordinates as fallback)

---

## 8. Firestore Schema Updates

### 8.1 Products Collection
```typescript
// Collection: products
{
  id: string,
  seller_id: string,
  title: string,
  description: string,
  price: number,
  category_id: string,
  images: string[],
  
  // NEW: Enhanced location fields
  location: {
    address: string,
    city: string,
    region: string,
    country: string,
    postal_code: string,
    coordinates: {
      lat: number,      // ⚠️ Required for distance calculation
      lng: number       // ⚠️ Required for distance calculation
    },
    delivery_radius_km: number,   // 0-50
    pickup_available: boolean
  },
  
  listing_type: 'sale' | 'barter' | 'freebie',
  status: 'active' | 'sold' | 'draft',
  created_at: Timestamp,
  updated_at: Timestamp,
  
  // Denormalized for performance
  seller_name: string,
  seller_verified: boolean,
  average_rating: number,
  review_count: number
}
```

### 8.2 Firestore Geoqueries
**Challenge**: Firestore doesn't natively support geospatial queries.

**Solution**: Use **Geohash** indexing for efficient proximity searches.

**Implementation**:
```typescript
import geohash from 'ngeohash';

// When creating product:
const geohashPrecision = 6; // ~1.2km accuracy
const productGeohash = geohash.encode(
  product.location.coordinates.lat,
  product.location.coordinates.lng,
  geohashPrecision
);

// Store in product document
product.location.geohash = productGeohash;

// Query products near user:
const userGeohash = geohash.encode(userLat, userLng, precision);
const neighbors = geohash.neighbors(userGeohash); // 8 surrounding cells

const promises = [userGeohash, ...neighbors].map(hash => 
  db.collection('products')
    .where('location.geohash', '>=', hash)
    .where('location.geohash', '<=', hash + '~')
    .limit(50)
    .get()
);

const snapshots = await Promise.all(promises);
// Merge results, deduplicate, calculate exact distances, rank
```

---

## 9. Privacy & Performance Considerations

### 9.1 Privacy
- **User location**: Never store exact coordinates in database
- **Approximate display**: Show city/region publicly, not full address
- **Consent**: Always ask permission before accessing geolocation
- **Opt-out**: Users can disable location-based features

### 9.2 Performance Optimization
1. **Caching**:
   - Cache geocoded addresses (address → coordinates) for 30 days
   - Cache category average prices for 24 hours
   - Cache user location for session duration

2. **Pagination**:
   - Load 20 products initially
   - Infinite scroll for more results
   - Debounce filter changes (300ms)

3. **Lazy Distance Calculation**:
   - Calculate distance only for products in viewport
   - Use geohash for initial filtering (efficient)
   - Calculate exact Haversine distance for ranking (expensive, limited set)

4. **CDN for Images**:
   - Serve product images from Firebase CDN
   - Use responsive image sizes (thumbnail, medium, full)

---

## 10. User Stories Addressed

### US014 – Keyword Search
- ✅ Relevance score (30% weight) prioritizes keyword matches
- ✅ Combined with distance for local-first results

### US015 – Category Filters
- ✅ `category_id` filter in `/api/products/nearby`
- ✅ Hierarchical categories from seeded data

### US016 – Price Filters
- ✅ `min_price` and `max_price` query parameters
- ✅ Price competitiveness score (5% weight)

### US017 – Free Listing (Gifters) & Discovery
- ✅ `listing_type: 'freebie'` gets 100-point price score (highest priority)
- ✅ Labeled "Free" on product cards
- ✅ Same proximity ranking as paid listings

---

## 11. Implementation Phases

### Phase 1: Core Location Infrastructure (Days 1-3)
- [ ] Geolocation service (`lib/geolocation.ts`)
- [ ] Distance calculation utility (`lib/distance.ts`)
- [ ] Geocoding service integration (Google Maps API)
- [ ] Update `productTypes.ts` with location fields

### Phase 2: Database & API (Days 4-6)
- [ ] Update Firestore schema (add `location` object)
- [ ] Implement geohash indexing
- [ ] Create `/api/products/nearby` endpoint
- [ ] Enhance `/api/products` POST endpoint with geocoding

### Phase 3: Ranking Algorithm (Days 7-8)
- [ ] Implement 5-factor scoring system
- [ ] Distance score function
- [ ] Relevance score function
- [ ] Seller rating, freshness, price score functions
- [ ] Integration with `/api/products/nearby`

### Phase 4: UI Components (Days 9-11)
- [ ] Location filter panel (marketplace)
- [ ] "Use My Location" button
- [ ] Distance slider
- [ ] Manual location entry
- [ ] Product card enhancements (distance badge, nearby tag)

### Phase 5: Seller Listing Form (Days 12-14)
- [ ] Location input fields in `/vendor/add-product`
- [ ] Address autocomplete (Google Places API)
- [ ] Delivery radius selector
- [ ] Pickup availability checkbox
- [ ] Map preview of delivery area

### Phase 6: Testing & Optimization (Days 15-16)
- [ ] Test geolocation across devices/browsers
- [ ] Performance testing (1000+ products)
- [ ] Caching implementation
- [ ] Error handling (no location permission, geocoding failures)

---

## 12. Dependencies

### External APIs
1. **Google Maps Geocoding API**
   - **Purpose**: Convert addresses to coordinates
   - **Cost**: $5 per 1000 requests (free tier: $200/month)
   - **Alternative**: Mapbox (cheaper)

2. **Google Places Autocomplete API**
   - **Purpose**: Address suggestions in seller form
   - **Cost**: $17 per 1000 requests
   - **Alternative**: Manual entry only (no cost)

### NPM Packages
```json
{
  "ngeohash": "^0.6.3",           // Geohash encoding/decoding
  "@googlemaps/js-api-loader": "^1.16.6",  // Google Maps integration
  "geolib": "^3.3.4"               // Additional geospatial utilities
}
```

---

## 13. Success Metrics

### User Engagement
- **Target**: 60% of users enable location permissions
- **Target**: 40% of searches use location filters
- **Target**: Products within 10km get 3x more clicks

### Performance
- **Target**: Marketplace page loads in < 2 seconds (US014-AC01)
- **Target**: Distance calculations complete in < 100ms for 100 products
- **Target**: 95% of nearby API requests return within 1 second

### Business Impact
- **Target**: 25% increase in local transactions (pickup/delivery)
- **Target**: 15% reduction in failed deliveries (distance mismatch)
- **Target**: Higher conversion rate for nearby products (< 5km)

---

## 14. Future Enhancements

### V2 Features
1. **Delivery Cost Calculator**
   - Dynamic pricing based on distance
   - Integration with courier APIs (Royal Mail, DHL)

2. **Saved Locations**
   - "Home", "Work", "Favorite Spot"
   - Quick switch between locations

3. **Location-Based Notifications**
   - "New product listed 2 km from you!"
   - Push notifications for nearby deals

4. **Heatmap Visualization**
   - Show product density on map
   - Interactive map view in marketplace

5. **Multi-Location Sellers**
   - Support sellers with multiple warehouses/shops
   - Route to nearest location automatically

---

## Conclusion

This location-based discovery system ensures AfriConnect Exchange users find relevant products efficiently, prioritizing proximity while balancing other quality factors. The Haversine formula provides accurate distance calculations, geohash indexing enables scalable queries, and the multi-factor ranking algorithm delivers personalized, trust-worthy results.

**Next Steps**: Proceed with Phase 1 implementation (geolocation services and distance utilities).
