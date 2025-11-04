'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'link';
import { MapPin, Navigation, Package, Truck, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WishlistButton } from '@/components/wishlist/wishlist-button';
import { formatDistance } from '@/lib/geolocation';
import type { RankedProduct } from '@/lib/product-ranking';

interface ProductCardProps {
  product: RankedProduct;
  showDistance?: boolean;
}

export default function ProductCard({
  product,
  showDistance = true,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const primaryImage =
    product.images && product.images.length > 0
      ? typeof product.images[0] === 'string'
        ? product.images[0]
        : product.images[0].url
      : '/images/placeholder-product.jpg';

  const isNearby =
    showDistance && product.distanceFromUser !== undefined && product.distanceFromUser <= 5;
  const isFree = product.listing_type === 'freebie' || product.price === 0;
  const isBarter = product.listing_type === 'barter';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: `/product/${product.id}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image Container */}
      <Link href={`/product/${product.id}`} className="block relative group">
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          <Image
            src={imageError ? '/images/placeholder-product.jpg' : primaryImage}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
          />

          {/* Top Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              {isFree && (
                <Badge className="bg-brand-growth-green text-white shadow-md">
                  Free
                </Badge>
              )}
              {isBarter && (
                <Badge className="bg-brand-progress-blue text-white shadow-md">
                  Barter
                </Badge>
              )}
              {isNearby && (
                <Badge className="bg-brand-diaspora-orange text-white shadow-md flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Nearby
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              <WishlistButton 
                productId={product.id!} 
                className="h-8 w-8 shadow-md"
              />
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md"
                onClick={(e) => {
                  e.preventDefault();
                  handleShare();
                }}
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Verified Seller Badge */}
          {product.seller_verified && (
            <div className="absolute bottom-2 right-2">
              <Badge
                variant="secondary"
                className="bg-white/90 text-blue-600 text-xs"
              >
                ✓ Verified
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-brand-progress-blue transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center justify-between">
          {isFree ? (
            <p className="text-2xl font-bold text-brand-growth-green">FREE</p>
          ) : isBarter ? (
            <p className="text-sm font-medium text-brand-progress-blue">
              Open to barter
            </p>
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              £{product.price.toFixed(2)}
            </p>
          )}
        </div>

        {/* Location & Distance */}
        {showDistance && product.distanceFromUser !== undefined && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {formatDistance(product.distanceFromUser)}
            </span>
            {product.location?.city && (
              <span className="text-gray-400 hidden sm:inline">
                · {product.location.city}
              </span>
            )}
          </div>
        )}

        {/* Delivery Options */}
        <div className="flex items-center gap-3">
          <TooltipProvider>
            {product.location?.pickup_available && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-brand-progress-blue">
                    <Package className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">Pickup</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Local pickup available</p>
                </TooltipContent>
              </Tooltip>
            )}

            {product.location?.delivery_radius_km &&
              product.location.delivery_radius_km > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-brand-growth-green">
                      <Truck className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline">Delivery</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Delivers within {product.location.delivery_radius_km} km
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
          </TooltipProvider>
        </div>

        {/* Seller Info & Rating */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
              {product.seller_avatar ? (
                <Image
                  src={product.seller_avatar}
                  alt={product.seller_name || 'Seller'}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-600">
                  {product.seller_name?.charAt(0).toUpperCase() || 'S'}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-700 truncate">
              {product.seller_name || 'Unknown Seller'}
            </span>
          </div>

          {product.average_rating && product.average_rating > 0 && (
            <div className="flex items-center gap-1 text-sm flex-shrink-0">
              <span className="text-yellow-500">★</span>
              <span className="font-medium text-gray-900">
                {product.average_rating.toFixed(1)}
              </span>
              <span className="text-gray-400 hidden sm:inline">
                ({product.review_count || 0})
              </span>
            </div>
          )}
        </div>

        {/* Mobile: Add to Cart/Contact Seller */}
        <div className="sm:hidden">
          <Button className="w-full bg-brand-diaspora-orange hover:bg-yellow-600 text-white">
            {isFree ? 'Contact' : isBarter ? 'Make Offer' : 'View Details'}
          </Button>
        </div>
      </div>
    </div>
  );
}
