
'use client';
import { useWishlist } from '@/context/wishlist-context';
import { useAuth } from '@/context/auth-context';
import { Card3D } from '@/components/ui/card-3d';
import { Button3D } from '@/components/ui/button-3d';
import { Loader2, Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { toast } from '@/hooks/use-toast';

const formatCurrency = (amount: number, currency: string = 'GBP') => {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount / 100);
};

export function WishlistPage() {
  const { user } = useAuth();
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddToCart = async (item: any) => {
    if (!item.product) return;
    
    try {
      addToCart(item.product, 1);
      toast({
        title: 'Added to cart',
        description: `${item.product.title} has been added to your cart`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card3D>
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Sign in to view your wishlist</h2>
            <p className="text-muted-foreground mb-6">Save your favorite items and access them anytime</p>
            <Button3D onClick={() => router.push('/auth/login')}>
              Sign In
            </Button3D>
          </div>
        </Card3D>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <p className="text-muted-foreground">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {wishlistItems.length === 0 ? (
        <Card3D>
          <div className="p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding items you love to your wishlist
            </p>
            <Button3D onClick={() => router.push('/marketplace')}>
              Browse Marketplace
            </Button3D>
          </div>
        </Card3D>
      ) : (
        /* Wishlist Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <Card3D key={item.id}>
                <div className="relative group">
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>

                  {/* Product Image */}
                  <div 
                    className="relative h-56 bg-gray-100 rounded-t-2xl overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/product/${item.productId}`)}
                  >
                    {product.images?.[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Price Badge */}
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg">
                      <span className="font-bold text-lg">
                        {formatCurrency(product.price, product.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 
                      className="font-semibold text-base mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => router.push(`/product/${item.productId}`)}
                    >
                      {product.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button3D
                        className="flex-1"
                        onClick={() => handleAddToCart(item)}
                        disabled={product.status !== 'active'}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button3D>
                      <Button3D
                        variant="outline"
                        onClick={() => router.push(`/product/${item.productId}`)}
                      >
                        View
                      </Button3D>
                    </div>

                    {/* Added Date */}
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {wishlistItems.length > 0 && (
        <div className="mt-8 flex justify-center gap-4">
          <Button3D
            variant="outline"
            onClick={() => router.push('/marketplace')}
          >
            Continue Shopping
          </Button3D>
        </div>
      )}
    </div>
  );
}
