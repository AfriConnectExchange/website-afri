'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import LocationFilter from './LocationFilter'
import ProductCardEnhanced from './ProductCardEnhanced'
import type { RankedProduct } from '@/lib/product-ranking'

export default function MarketplaceWithLocation() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<RankedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('ranking')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Location filters
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(10)
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [listingType, setListingType] = useState<string | undefined>()
  const [minPrice, setMinPrice] = useState<number | undefined>()
  const [maxPrice, setMaxPrice] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [pickupOnly, setPickupOnly] = useState(false)
  const [deliveryOnly, setDeliveryOnly] = useState(false)

  // Fetch products
  const fetchProducts = async () => {
    if (!userLocation) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        radius: radius.toString(),
        sort: sortBy,
        limit: '20'
      })

      if (categoryId) params.append('category_id', categoryId)
      if (listingType) params.append('listing_type', listingType)
      if (minPrice !== undefined) params.append('min_price', minPrice.toString())
      if (maxPrice !== undefined) params.append('max_price', maxPrice.toString())
      if (searchQuery) params.append('query', searchQuery)
      if (pickupOnly) params.append('pickup_only', 'true')
      if (deliveryOnly) params.append('delivery_only', 'true')

      const response = await fetch(`/api/products/nearby?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLocation) {
      fetchProducts()
    }
  }, [userLocation, radius, sortBy, categoryId, listingType, minPrice, maxPrice, searchQuery, pickupOnly, deliveryOnly])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#2C2A4A]">Marketplace</h1>
            
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ranking">Best Match</SelectItem>
                  <SelectItem value="distance">Nearest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filters Button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <SlidersHorizontal className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <LocationFilter
                      onLocationChange={(location) => setUserLocation(location)}
                      onRadiusChange={(r) => setRadius(r)}
                      onPickupChange={(checked) => setPickupOnly(checked)}
                      onDeliveryChange={(checked) => setDeliveryOnly(checked)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <LocationFilter
                onLocationChange={(location) => setUserLocation(location)}
                onRadiusChange={(r) => setRadius(r)}
                onPickupChange={(checked) => setPickupOnly(checked)}
                onDeliveryChange={(checked) => setDeliveryOnly(checked)}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* No Location Permission Banner */}
            {!userLocation && !loading && (
              <div className="bg-[#F4B400]/10 border border-[#F4B400] rounded-lg p-6 mb-6 text-center">
                <p className="text-[#2C2A4A] font-semibold mb-2">
                  Enable location for personalized results
                </p>
                <p className="text-sm text-gray-600">
                  Allow location access to see products near you, or enter your city manually in the filters.
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#F4B400]" />
                <span className="ml-3 text-gray-600">Loading products...</span>
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Found {products.length} products near you
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCardEnhanced
                      key={product.id}
                      product={product}
                      userLocation={userLocation}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && userLocation && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No products found matching your filters</p>
                <Button
                  onClick={() => {
                    setRadius(50)
                    setCategoryId(undefined)
                    setListingType(undefined)
                    setMinPrice(undefined)
                    setMaxPrice(undefined)
                    setSearchQuery('')
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
