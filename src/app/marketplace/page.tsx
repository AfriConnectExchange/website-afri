
'use client';
import { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FilterPanel } from '@/components/marketplace/FilterPanel';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';
import { PromotionalBanner } from '@/components/marketplace/PromotionalBanner';
import { QuickActionsBar } from '@/components/marketplace/QuickActionsBar';
import type { Category } from '@/lib/types';

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_id: number;
  listing_type: 'sale' | 'barter' | 'freebie';
  status: 'active' | 'sold' | 'delisted';
  images: string[];
  location_text: string;
  location?: {
    address?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    country?: string;
    postal_code?: string;
    region?: string;
  };
  created_at: string;
  updated_at: string;
  quantity_available: number;
  specifications?: any;
  shipping_policy?: any;
  is_local_pickup_only?: boolean;
  average_rating: number;
  review_count: number;
  tags?: string[];
  
  // Properties from old interface, to be mapped or joined
  name: string; // Will map from title
  originalPrice?: number;
  rating: number; 
  reviews: number; 
  seller: string; 
  sellerVerified: boolean; 
  image: string; // Will use the first image from the images array
  category: string;
  featured?: boolean;
  discount?: number;
  isFree?: boolean;
  stockCount: number;
  sellerDetails: any;
  distance?: number; // Calculated distance from user location
}


export interface FilterState {
  searchQuery: string;
  selectedCategories: string[];
  priceRange: { min: number | null; max: number | null };
  verifiedSellersOnly: boolean;
  featuredOnly: boolean;
  onSaleOnly: boolean;
  freeShippingOnly: boolean;
  freeListingsOnly: boolean;
  // Location-based filtering (optional)
  userLocation?: { lat: number; lng: number; address?: string } | null;
  locationRadius?: number;
  deliveryOptions?: {
    localPickup: boolean;
    shipping: boolean;
    delivery: boolean;
  };
}

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MarketplacePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { cart, addToCart, cartCount } = useCart();
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [searchError, setSearchError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCategories: [],
    priceRange: { min: null, max: null },
    verifiedSellersOnly: false,
    featuredOnly: false,
    onSaleOnly: false,
    freeShippingOnly: false,
    freeListingsOnly: false,
    userLocation: null,
    locationRadius: 25,
    deliveryOptions: {
      localPickup: false,
      shipping: false,
      delivery: false,
    },
  });

  // Transform hierarchical categories - only keep top-level (main) categories
  const flattenCategories = useCallback((cats: any[]): Category[] => {
    const result: Category[] = [];
    // Only take top-level categories (max 7-10 main categories)
    cats.forEach((item) => {
      const id = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      result.push({
        id,
        name: item.name,
        description: item.description,
        count: item.count || 0,
        children: item.children || [], // Keep children for potential expansion
      });
    });
    return result;
  }, []);

  const fetchProducts = useCallback(async (currentFilters: FilterState, currentSortBy: string, categoryList: Category[]) => {
    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (currentFilters.searchQuery.length >= 3) {
        params.append('q', currentFilters.searchQuery);
      }
      
      if (currentFilters.selectedCategories.length > 0 && !currentFilters.selectedCategories.includes('all')) {
        currentFilters.selectedCategories.forEach(cat => params.append('category', cat));
      }
      
      if (currentFilters.priceRange.min !== null) {
        params.append('minPrice', currentFilters.priceRange.min.toString());
      }
      
      if (currentFilters.priceRange.max !== null) {
        params.append('maxPrice', currentFilters.priceRange.max.toString());
      }
      
      if (currentFilters.verifiedSellersOnly) {
        params.append('verifiedOnly', 'true');
      }
      
      if (currentFilters.featuredOnly) {
        params.append('featuredOnly', 'true');
      }
      
      if (currentFilters.onSaleOnly) {
        params.append('onSaleOnly', 'true');
      }
      
      if (currentFilters.freeShippingOnly) {
        params.append('freeShippingOnly', 'true');
      }
      
      if (currentFilters.freeListingsOnly) {
        params.append('freeListingsOnly', 'true');
      }
      
      // Location-based filtering (optional - uses different endpoint)
      if (currentFilters.userLocation && 
          typeof currentFilters.userLocation.lat === 'number' && 
          typeof currentFilters.userLocation.lng === 'number') {
        params.append('lat', currentFilters.userLocation.lat.toString());
        params.append('lng', currentFilters.userLocation.lng.toString());
        params.append('radius', (currentFilters.locationRadius || 25).toString());
        
        if (currentFilters.deliveryOptions?.localPickup) {
          params.append('localPickup', 'true');
        }
        if (currentFilters.deliveryOptions?.shipping) {
          params.append('shipping', 'true');
        }
        if (currentFilters.deliveryOptions?.delivery) {
          params.append('delivery', 'true');
        }
      }
      
      params.append('sortBy', currentSortBy);
      params.append('limit', '50');
      
      // Always use regular endpoint - we'll filter by location client-side
      const response = await fetch(`/api/marketplace/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      let productsData = data.products || [];
      
      // Map Firestore product data to match Product interface
      productsData = productsData.map((product: any) => ({
        ...product,
        // Ensure compatibility with both old and new interfaces
        name: product.title || product.name || 'Unnamed Product',
        title: product.title || product.name || 'Unnamed Product',
        image: product.images?.[0] || product.image || '',
        images: product.images || (product.image ? [product.image] : []),
        category: product.category || 'Uncategorized',
        seller: product.sellerDetails?.name || product.sellerDetails?.username || 'Unknown Seller',
        sellerVerified: product.sellerDetails?.isVerified || false,
        rating: product.average_rating || 0,
        reviews: product.review_count || 0,
        stockCount: product.quantity_available || 0,
        isFree: product.listing_type === 'freebie' || product.price === 0,
      }));
      
      // If user location is available, calculate distances and filter by radius
      if (currentFilters.userLocation && 
          typeof currentFilters.userLocation.lat === 'number' && 
          typeof currentFilters.userLocation.lng === 'number') {
        
        const userLat = currentFilters.userLocation.lat;
        const userLng = currentFilters.userLocation.lng;
        const radius = currentFilters.locationRadius || 25;
        
        // Calculate distance for each product
        productsData = productsData.map((product: Product) => {
          if (product.location?.coordinates?.lat && product.location?.coordinates?.lng) {
            const distance = calculateDistance(
              userLat,
              userLng,
              product.location.coordinates.lat,
              product.location.coordinates.lng
            );
            return { ...product, distance };
          }
          return { ...product, distance: Infinity }; // Products without location go to the end
        });
        
        // Filter by radius
        productsData = productsData.filter((product: Product) => 
          product.distance !== undefined && product.distance <= radius
        );
        
        // Sort by distance (nearest first) when location filter is active
        productsData.sort((a: Product, b: Product) => 
          (a.distance || Infinity) - (b.distance || Infinity)
        );
      }
      
      setProducts(productsData);
      setTotalProducts(productsData.length);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load products. Please try again.',
      });
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  // Auto-detect user location on page load (optional, non-intrusive)
  useEffect(() => {
    const detectLocation = async () => {
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000, // Cache for 5 minutes
            });
          });
          
          // Silently update location without forcing filter to be active
          // User can expand Location-Based Discovery to see/use it
          const detectedLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Don't automatically filter - just store the location
          // User can manually enable location filtering via the panel
          console.log('User location detected:', detectedLocation);
          
        } catch (error) {
          // Silently fail - location is optional
          console.log('Location detection skipped or denied');
        }
      }
    };
    
    detectLocation();
  }, []);
  
  // Initialize categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories/list?includeCounts=true&hierarchical=true');
        if (response.ok) {
          const data = await response.json();
          const categoryList = flattenCategories(data.categories || []);
          // Sort categories by count (highest first), then by name
          const sortedCategories = categoryList.sort((a: Category, b: Category) => {
            const countA = a.count || 0;
            const countB = b.count || 0;
            if (countB !== countA) {
              return countB - countA; // Descending by count
            }
            return a.name.localeCompare(b.name); // Alphabetical if counts are equal
          });
          setCategories(sortedCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [flattenCategories]);
  
  useEffect(() => {
    if (categories.length > 0) {
      fetchProducts(filters, sortBy, categories);
    }
  }, [fetchProducts, filters, sortBy, categories]);


  const onNavigate = (page: string, productId?: string) => {
    if (page === 'product' && productId) {
      router.push(`/product/${productId}`);
    } else {
        router.push(`/${page}`);
    }
  };

  const onAddToCart = (product: Product) => {
    addToCart(product);
  };

  // Handle search with validation (US014)
  const handleSearch = (query: string) => {
    setSearchError('');
    if (query.length > 0 && query.length < 3) {
      setSearchError('Please enter at least 3 letters or numbers.');
      setFilters(prev => ({ ...prev, searchQuery: query }));
      return;
    }
    const alphanumericCount = query.replace(/[^a-zA-Z0-9]/g, '').length;
    if (query.length > 0 && alphanumericCount < 3) {
      setSearchError('Please enter at least 3 letters or numbers.');
      setFilters(prev => ({ ...prev, searchQuery: query }));
      return;
    }
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilters({
      searchQuery: '',
      selectedCategories: [],
      priceRange: { min: null, max: null },
      verifiedSellersOnly: false,
      featuredOnly: false,
      onSaleOnly: false,
      freeShippingOnly: false,
      freeListingsOnly: false,
    });
    setSearchError('');
  };

  const getNoResultsMessage = () => {
    if (filters.searchQuery.length >= 3) {
      return 'No products found. Try a different keyword.'; // US014-AC02
    }
    if (filters.selectedCategories.length > 0) {
      return 'No products found in this category.'; // US015-AC02
    }
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) {
      return 'No products found in this price range.'; // US016-AC03
    }
    if (filters.freeListingsOnly) {
      return 'No free products found.'; // US017-AC02
    }
    return 'No products match your current filters.';
  };
  
  return (
    <>
    <Header cartCount={cartCount} />
    <div className="container mx-auto px-0 sm:px-4 py-6 md:py-8 relative">
      {/* Promotional Banner */}
      <div className="mb-6 px-4 sm:px-0">
        <PromotionalBanner
          banners={[
            {
              id: '1',
              title: '🎉 Special Offers Today!',
              description: 'Discover amazing deals from verified sellers',
              ctaText: 'Shop Deals',
              ctaAction: () => handleFiltersChange({ onSaleOnly: true }),
              bgColor: 'from-orange-400 to-pink-500',
              icon: 'sparkles',
            },
            {
              id: '2',
              title: '🆕 Fresh Arrivals',
              description: 'Check out the newest products in marketplace',
              ctaText: 'Explore New',
              ctaAction: () => setSortBy('created_at_desc'),
              bgColor: 'from-blue-400 to-purple-500',
              icon: 'trending',
            },
            {
              id: '3',
              title: '🎁 Free Listings Available',
              description: 'Get items for free from generous sellers',
              ctaText: 'Browse Free',
              ctaAction: () => handleFiltersChange({ freeListingsOnly: true }),
              bgColor: 'from-green-400 to-teal-500',
              icon: 'gift',
            },
          ]}
        />
      </div>

      {/* Quick Actions Bar */}
      <div className="mb-6">
        <QuickActionsBar
          actions={[
            {
              id: 'become-seller',
              title: 'Start Selling',
              description: 'List your items today',
              icon: 'store',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-700',
              action: () => router.push('/seller'),
              badge: 'Free',
            },
            {
              id: 'free-items',
              title: 'Free Items',
              description: 'Get freebies now',
              icon: 'package',
              bgColor: 'bg-green-50',
              textColor: 'text-green-700',
              action: () => handleFiltersChange({ freeListingsOnly: true }),
            },
            {
              id: 'verified',
              title: 'Verified Only',
              description: 'Trusted sellers',
              icon: 'shield',
              bgColor: 'bg-purple-50',
              textColor: 'text-purple-700',
              action: () => handleFiltersChange({ verifiedSellersOnly: true }),
            },
            {
              id: 'new-arrivals',
              title: 'New Arrivals',
              description: 'Latest products',
              icon: 'zap',
              bgColor: 'bg-orange-50',
              textColor: 'text-orange-700',
              action: () => setSortBy('created_at_desc'),
              badge: '🔥',
            },
          ]}
        />
      </div>

      {/* Page Header */}
      <div className="mb-6 md:mb-8 px-4 sm:px-0">
        <h1 className="mb-1 text-2xl md:text-3xl font-bold tracking-tight">
          Marketplace
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Discover authentic products from sellers in the UK
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 md:gap-8">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <FilterPanel
              categories={categories}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearAllFilters={handleClearAllFilters}
              currency="£"
              isLoading={!categories || categories.length === 0}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Mobile Search and Filters */}
          <div className="lg:hidden px-4 mb-4 flex gap-2">
            <SearchBar
              value={filters.searchQuery}
              onChange={(value) => handleSearch(value)}
              onSearch={() => fetchProducts(filters, sortBy, categories)}
              placeholder="Search..."
              className="flex-grow"
            />
             <Sheet
              open={mobileFiltersOpen}
              onOpenChange={setMobileFiltersOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-10 w-10"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="w-full rounded-t-2xl max-h-[85vh] flex flex-col p-0"
              >
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4">
                  <FilterPanel
                    categories={categories}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClearAllFilters={handleClearAllFilters}
                    currency="£"
                    isLoading={!categories || categories.length === 0}
                  />
                </div>
                <div className="p-4 border-t bg-background">
                  <Button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-full"
                  >
                    View {totalProducts} Results
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
            {searchError && (
              <p className="text-xs text-destructive mt-1 px-4 lg:px-0">{searchError}</p>
            )}


          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 px-4 sm:px-0">
            <div>
              <p className="text-muted-foreground text-xs md:text-sm">
                Showing {products.length} of {totalProducts} products
                {filters.searchQuery && ` for "${filters.searchQuery}"`}
              </p>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="average_rating_desc">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          <div className="px-4 sm:px-0">
            <ProductGrid
              products={products}
              loading={loading}
              onNavigate={onNavigate}
              onAddToCart={onAddToCart}
              currency="£"
              searchQuery={filters.searchQuery}
              noResultsMessage={getNoResultsMessage()}
              hasMore={false}
            />
          </div>

        </div>
      </div>
    </div>
    </>
  );
}

    