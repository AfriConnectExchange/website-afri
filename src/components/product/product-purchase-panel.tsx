
'use client';

import { useState } from 'react';
import { Star, Heart, Share2, ShoppingCart, Shield, Handshake, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/app/marketplace/page';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface ProductPurchasePanelProps {
  product: Product;
  onAddToCart: (product: any, quantity: number) => void;
}

export function ProductPurchasePanel({ product, onAddToCart }: ProductPurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const formatPrice = (price: number) => `£${price.toLocaleString()}`;

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
  };
  
  const handleProposeBarter = () => {
    router.push(`/barter/propose?productId=${product.id}`);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: isWishlisted ? "Item removed from your wishlist" : "Item added to your wishlist",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* Wishlist and Share buttons - Top Right */}
      <div className="absolute top-0 right-0 flex items-center gap-1 z-10">
        <Button 
          size="icon" 
          variant="ghost" 
          className="rounded-full h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleWishlist}
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
          />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="rounded-full h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          {product.featured ? <Badge className="bg-primary text-[10px] sm:text-xs">Featured</Badge> : null}
          {product.discount ? <Badge variant="destructive" className="text-[10px] sm:text-xs">-{product.discount}%</Badge> : null}
        </div>
        <h1 className="mb-2 text-2xl md:text-3xl font-bold leading-tight pr-20">{product.name}</h1>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">({product.review_count} reviews)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl md:text-3xl font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-lg md:text-xl text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {product.description}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-9 w-9"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span id="quantity" className="px-3 text-center font-medium text-sm">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
              disabled={quantity >= product.stockCount}
              className="h-9 w-9"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {product.stockCount} pieces available
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button 
            size="lg" 
            className="w-full h-11 sm:h-12 font-semibold text-sm sm:text-base" 
            onClick={handleAddToCartClick}
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Add to Cart
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full h-11 sm:h-12 font-semibold text-sm sm:text-base border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-600 dark:text-orange-500 dark:hover:bg-orange-950/20 dark:hover:text-orange-400" 
            onClick={handleProposeBarter}
          >
            <Handshake className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Propose Barter
          </Button>
        </div>
      </div>
    </div>
  );
}
