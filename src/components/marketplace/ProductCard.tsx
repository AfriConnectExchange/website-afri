
'use client';
import { Star, ShoppingCart, Gift, MapPin, Clock, Package, Eye, Share2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Button3D } from '../ui/button-3d';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { FreeListingBadge } from './ListingBadges';
import { WishlistButton } from '@/components/wishlist/wishlist-button';
import { motion } from 'framer-motion';
import VerifiedIcon from '@mui/icons-material/Verified';
import type { Product } from '@/app/marketplace/page';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: any) => void;
  animationDelay?: number;
  currency?: string;
}

export function ProductCard({
  product,
  onNavigate,
  onAddToCart,
  animationDelay = 0,
  currency = '£',
}: ProductCardProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const formatPrice = (price: number) => `${currency}${price.toLocaleString()}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.isFree) {
      onNavigate('product', product.id);
      return;
    }
    onAddToCart(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate('product', product.id);
  };
  
  // Extract image URL - handle both string and object formats
  const imageSrc = 
    product.images && product.images.length > 0 
      ? (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any)?.url || '/placeholder.svg')
      : product.image || '/placeholder.svg';
  
  const locationText = product.location_text || product.sellerDetails?.location || '';
  
  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  // Stock status
  const getStockStatus = () => {
    const stock = product.quantity_available || product.stockCount || 0;
    if (stock === 0) return { text: 'Out of stock', color: 'text-red-500' };
    if (stock < 5) return { text: `Only ${stock} left`, color: 'text-orange-500' };
    return { text: `${stock} available`, color: 'text-green-600' };
  };

  const stockStatus = getStockStatus();
  const isNew = product.created_at && new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      className="h-full"
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
    >
      <Card className="group border-2 border-gray-100 hover:border-primary/20 hover:shadow-[0_12px_0_0_rgba(0,0,0,0.04),0_16px_32px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 h-full flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50/30 shadow-[0_6px_0_0_rgba(0,0,0,0.03),0_8px_16px_-4px_rgba(0,0,0,0.08)]">
        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Image Section with Enhanced Badges */}
          <div className="relative overflow-hidden">
            <div
              className="aspect-[5/4] w-full cursor-pointer bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl"
              onClick={() => onNavigate('product', product.id)}
            >
              <ImageWithFallback
                src={imageSrc}
                fallbackSrc="/placeholder.svg"
                alt={product.name}
                width={400}
                height={320}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Top Left Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.category && (
                <Badge className="bg-white/90 text-gray-700 text-[10px] px-2 py-0.5 font-medium shadow-sm">
                  {product.category}
                </Badge>
              )}
              {isNew && (
                <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5 font-bold animate-pulse">
                  NEW
                </Badge>
              )}
              {product.isFree && <FreeListingBadge variant="compact" />}
              {product.featured && !product.isFree ? (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] px-2 py-0.5 font-bold">
                  ⭐ Featured
                </Badge>
              ) : null}
              {product.discount && !product.isFree ? (
                <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold">
                  -{product.discount}% OFF
                </Badge>
              ) : null}
            </div>

            {/* Top Right - Wishlist */}
            <div className="absolute top-3 right-3">
              <WishlistButton 
                productId={product.id} 
                className="shadow-lg backdrop-blur-sm"
              />
            </div>

            {/* Quick Actions on Hover */}
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-3 left-3 right-3 flex gap-2"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleQuickView}
                  className="flex-1 bg-white/95 hover:bg-white text-gray-700 shadow-lg backdrop-blur-sm font-medium"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Quick View
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm"
                >
                  <Share2 className="w-4 h-4 text-gray-600" />
                </Button>
              </motion.div>
            )}

            {/* Listing Type Badge */}
            {product.listing_type !== 'sale' && (
              <div className="absolute bottom-3 right-3">
                <Badge className={cn(
                  "text-[10px] px-2 py-1 font-bold shadow-md",
                  product.listing_type === 'barter' ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                )}>
                  {product.listing_type === 'barter' ? '🤝 Barter' : '🎁 Free'}
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 flex-1 flex flex-col space-y-2">
            {/* Title */}
            <h3
              className="line-clamp-2 cursor-pointer text-sm font-bold leading-tight h-[40px] text-gray-900 hover:text-primary transition-colors"
              onClick={() => onNavigate('product', product.id)}
            >
              {product.name}
            </h3>

            {/* Rating & Location Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-700">{product.rating}</span>
                <span className="text-gray-500">({product.review_count || product.reviews})</span>
              </div>
              {product.distance !== undefined && product.distance !== Infinity ? (
                <div className="flex items-center gap-1 text-primary font-medium">
                  <MapPin className="w-3 h-3" />
                  <span>{product.distance < 1 
                    ? `${Math.round(product.distance * 1000)}m` 
                    : `${product.distance.toFixed(1)}km`} away
                  </span>
                </div>
              ) : locationText ? (
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">{locationText}</span>
                </div>
              ) : null}
            </div>

            {/* Seller & Stock Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-700">{product.seller}</span>
                {product.sellerVerified && (
                  <VerifiedIcon className="text-blue-500 w-4 h-4" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3 text-gray-400" />
                <span className={cn("text-xs font-medium", stockStatus.color)}>
                  {stockStatus.text}
                </span>
              </div>
            </div>

            {/* Time & Shipping Info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{getTimeAgo(product.created_at)}</span>
              </div>
              {product.is_local_pickup_only && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                  Pickup Only
                </Badge>
              )}
            </div>

            {/* Price & Action Row */}
            <div className="flex justify-between items-end mt-auto pt-3">
              <div>
                {product.isFree ? (
                  <span className="text-lg font-bold text-green-600">FREE</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button3D
                  size="icon"
                  onClick={handleAddToCart}
                  disabled={stockStatus.text === 'Out of stock'}
                  variant={product.isFree ? "success" : "default"}
                  className="h-9 w-9 shadow-lg"
                >
                  {product.isFree ? (
                    <Gift className="w-4 h-4" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </Button3D>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
