
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
// Fetch data from API endpoints instead of using mock JSON

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
  created_at: string;
  updated_at: string;
  quantity_available: number;
  specifications?: any;
  shipping_policy?: any;
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
}

export interface Category {
  id: string;
  name: string;
  count: number;
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
  });

  // Fetch/filter/sort products (reads latest products if productList not provided)
  function fetchProducts(currentFilters: FilterState, currentSortBy: string, productList?: Product[]) {
    setLoading(true);
    let filteredProducts: Product[] = Array.isArray(productList) ? [...productList] : [...products];

    // Smart search query
    if (currentFilters.searchQuery.length >= 3) {
      const searchTerms = currentFilters.searchQuery.toLowerCase().split(' ').filter(term => term);
      filteredProducts = filteredProducts.filter(p => {
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

    // Category
    if (currentFilters.selectedCategories.length > 0 && !currentFilters.selectedCategories.includes('all')) {
      const selectedCategoryName = categories.find((c: Category) => c.id === currentFilters.selectedCategories[0])?.name;
      if (selectedCategoryName) {
        filteredProducts = filteredProducts.filter(p => p.category === selectedCategoryName);
      }
    }

    // Price range
    if (currentFilters.priceRange.min !== null) {
      filteredProducts = filteredProducts.filter(p => p.price >= currentFilters.priceRange.min!);
    }
    if (currentFilters.priceRange.max !== null) {
      filteredProducts = filteredProducts.filter(p => p.price <= currentFilters.priceRange.max!);
    }
    
     // Free listings
    if (currentFilters.freeListingsOnly) {
      filteredProducts = filteredProducts.filter(p => p.price === 0);
    }
    
    // Verified sellers
    if (currentFilters.verifiedSellersOnly) {
        filteredProducts = filteredProducts.filter(p => p.sellerVerified === true);
    }

    // Sorting
    switch (currentSortBy) {
      case 'price_asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'average_rating_desc':
        filteredProducts.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case 'created_at_desc':
      default:
        filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    setProducts(filteredProducts);
    setTotalProducts(filteredProducts.length);
    setLoading(false);

  }
  
  useEffect(() => {
    // Load categories and initial products from API
    (async () => {
      setLoading(true)
      try {
        const catsRes = await fetch('/api/categories')
        const catsJson = await catsRes.json()
        setCategories(catsJson || [])

        // If no category selected, load recent products
          const productsRes = await fetch('/api/products/list?page=1&per_page=24')
          const productsJson = await productsRes.json()

          // productsJson is expected to be { items: [...], meta: { total, page, per_page } }
          const items = Array.isArray(productsJson?.items) ? productsJson.items : []

          // Map API product shape to the UI Product interface expected by ProductCard
          const mapped = (items || []).map((p: any) => ({
          id: p.id,
          seller_id: p.seller_id || p.seller || null,
          title: p.title || p.name || '',
          description: p.description || '',
          price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
          currency: p.currency || '£',
          category_id: p.category_id || p.category_id || null,
          listing_type: p.listing_type || 'sale',
          status: p.status || 'active',
          images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
          location_text: p.location_text || p.location || '',
          created_at: p.created_at,
          updated_at: p.updated_at,
          quantity_available: p.quantity_available ?? p.stockCount ?? 0,
          average_rating: p.average_rating ?? p.rating ?? 0,
          review_count: p.review_count ?? p.reviews ?? 0,
          tags: p.tags || [],

          // UI-facing aliases expected by ProductCard
          name: p.title || p.name || 'Untitled Product',
          originalPrice: p.originalPrice || null,
          rating: p.average_rating ?? p.rating ?? 0,
          reviews: p.review_count ?? p.reviews ?? 0,
          // Prefer seller_name (provided by active_products_view); fall back to any seller field or truncated id
          seller: p.seller_name || p.seller || (p.seller_id ? String(p.seller_id).slice(0,8) : 'Unknown'),
          // If view provides seller_rating use it to determine verified status heuristically or a provided boolean
          sellerVerified: typeof p.seller_verified !== 'undefined' ? !!p.seller_verified : (p.seller_rating ? p.seller_rating >= 3.5 : false),
          image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (typeof p.image === 'string' ? p.image : ''),
          category: p.category_name || p.category || '',
          featured: !!p.featured,
          discount: p.discount || 0,
          isFree: (p.price === 0) || p.isFree || false,
          stockCount: p.quantity_available ?? p.stockCount ?? 0,
          sellerDetails: p.sellerDetails ?? null,
        }))

  setProducts(mapped)
  setTotalProducts(mapped.length)
  // Apply filters/sorting against the freshly mapped products
  fetchProducts(filters, sortBy, mapped)
      
        // dev debug: log first mapped product
        try { console.debug('[marketplace] first mapped product', mapped && mapped[0]); } catch (e) {}
      } catch (err) {
        console.error('Marketplace load error', err)
      } finally {
        setLoading(false)
      }
    })()
    // Intentionally only depend on filters & sortBy; we passed mapped products into fetchProducts above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy]);


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
              onSearch={() => fetchProducts(filters, sortBy)}
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

    