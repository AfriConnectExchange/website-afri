'use client';
import { useWishlist } from '@/context/wishlist-context';
import { Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  showLabel?: boolean;
}

export function WishlistButton({ productId, className, showLabel = false }: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const inWishlist = isInWishlist(productId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
        toast({
          title: 'Removed from wishlist',
          description: 'Item has been removed from your wishlist',
        });
      } else {
        await addToWishlist(productId);
        toast({
          title: 'Added to wishlist',
          description: 'Item has been added to your wishlist',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'flex items-center gap-2 rounded-full transition-all',
        inWishlist
          ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
          : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-pink-50 hover:text-pink-600',
        showLabel ? 'px-4 py-2' : 'w-10 h-10 justify-center',
        className
      )}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn('w-5 h-5 transition-all', inWishlist && 'fill-current')}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {inWishlist ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
