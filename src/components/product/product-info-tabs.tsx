'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, MessageSquare, Ship } from 'lucide-react';
import type { Product } from '@/app/marketplace/page';
import { ReviewsSection, type Review } from './reviews-section';

interface ProductInfoTabsProps {
  product: Product;
  reviews: Review[];
  onReviewSubmit: () => void;
}

export function ProductInfoTabs({ product, reviews, onReviewSubmit }: ProductInfoTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      {/* Modern Tab Navigation with 3D Effect */}
      <div className="relative mb-4">
        <TabsList className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-0.5 h-auto justify-start border border-gray-200 dark:border-gray-800 rounded-lg shadow-md gap-1">
          <TabsTrigger 
            value="details" 
            className="text-xs sm:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-primary rounded-md px-3 py-2 gap-1.5 transition-all duration-300 data-[state=active]:scale-[1.02]"
          >
            <Info className="w-3.5 h-3.5" />
            Product Details
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            className="text-xs sm:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-primary rounded-md px-3 py-2 gap-1.5 transition-all duration-300 data-[state=active]:scale-[1.02]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Reviews ({reviews.length})
          </TabsTrigger>
          {product.shipping_policy && (
            <TabsTrigger 
              value="shipping" 
              className="text-xs sm:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-primary rounded-md px-3 py-2 gap-1.5 transition-all duration-300 data-[state=active]:scale-[1.02]"
            >
              <Ship className="w-3.5 h-3.5" />
              Shipping Info
            </TabsTrigger>
          )}
        </TabsList>
      </div>
      
      {/* Specifications Tab */}
      <TabsContent value="details" className="space-y-3">
        <Card className="shadow-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-blue-50/20 to-white dark:from-gray-900 dark:via-blue-950/10 dark:to-gray-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent border-b border-blue-100 dark:border-blue-900/30 py-3 px-4">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <div className="space-y-0">
                {Object.entries(product.specifications).map(([key, value], index) => (
                    <div 
                      key={key} 
                      className={`flex justify-between items-center py-2.5 px-3 rounded-md text-xs sm:text-sm transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${
                        index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''
                      }`}
                    >
                      <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-600 dark:text-gray-400 font-medium text-right">{String(value)}</span>
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center py-6">
                  <Info className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-xs sm:text-sm text-muted-foreground">No specifications provided for this product.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Reviews Tab */}
      <TabsContent value="reviews" className="space-y-3">
        <div className="bg-gradient-to-br from-white via-purple-50/20 to-white dark:from-gray-900 dark:via-purple-950/10 dark:to-gray-900 rounded-lg shadow-xl border border-purple-100 dark:border-purple-900/30 p-3 sm:p-4">
          <ReviewsSection 
            reviews={reviews} 
            productId={product.id}
            sellerId={product.seller_id}
            onReviewSubmit={onReviewSubmit}
          />
        </div>
      </TabsContent>
      
      {/* Shipping Info Tab */}
      {product.shipping_policy && Object.values(product.shipping_policy).some(val => val) && (
        <TabsContent value="shipping" className="space-y-3">
          <Card className="shadow-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-green-50/20 to-white dark:from-gray-900 dark:via-green-950/10 dark:to-gray-900 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent border-b border-green-100 dark:border-green-900/30 py-3 px-4">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Ship className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-0">
                {product.shipping_policy.weight && (
                  <div className="flex justify-between items-center py-2.5 px-3 rounded-md text-xs sm:text-sm bg-gray-50/50 dark:bg-gray-800/30 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all duration-200">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Package Weight</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{product.shipping_policy.weight} kg</span>
                  </div>
                )}
                {product.shipping_policy.dimensions && (
                  <div className="flex justify-between items-center py-2.5 px-3 rounded-md text-xs sm:text-sm hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all duration-200">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Package Dimensions</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {product.shipping_policy.dimensions.length} x {product.shipping_policy.dimensions.width} x {product.shipping_policy.dimensions.height} cm
                    </span>
                  </div>
                )}
                {product.is_local_pickup_only && (
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-md text-xs sm:text-sm bg-gray-50/50 dark:bg-gray-800/30 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all duration-200">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Delivery Options</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Local Pickup Only</span>
                  </div>
                )}
                {!product.is_local_pickup_only && (
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-md text-xs sm:text-sm hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-all duration-200">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Delivery Options</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Shipping Available</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
