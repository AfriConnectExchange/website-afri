
'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/app/marketplace/page';
import { ProductImageGallery } from './product-image-gallery';
import { ProductPurchasePanel } from './product-purchase-panel';
import { ProductInfoTabs } from './product-info-tabs';
import { SellerInfoCard } from './seller-info-card';
import { motion } from 'framer-motion';
import { Review } from './reviews-section';
import { Skeleton } from '../ui/skeleton';

interface ProductPageProps {
  productId: string;
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: any, quantity: number) => void;
}
// import mockProducts from '@/data/mock-products.json';
function ProductPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-4 md:py-6">
            <Skeleton className="h-6 w-48 mb-4 md:mb-6" />
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-6 md:mb-8">
                <div className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <div className="grid grid-cols-4 gap-2">
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
             <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2">
                    <Skeleton className="h-64 w-full" />
                </div>
                 <div className="lg:sticky top-24 self-start">
                    <Skeleton className="h-48 w-full" />
                 </div>
             </div>
        </div>
    )
}

export function ProductPageComponent({ productId, onNavigate, onAddToCart }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProductAndReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`)
      const json = await res.json()
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Error fetching product',
          description: json?.error || 'This product could not be found.',
        });
        setProduct(null);
      } else {
        // Map the raw API product shape into the UI-facing Product interface
        const p: any = json;
        const mapped: Product = {
          id: p.id,
          seller_id: p.seller_id || p.seller || null,
          title: p.title || p.name || '',
          description: p.description || '',
          price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
          currency: p.currency || '£',
          category_id: p.category_id ?? null,
          listing_type: p.listing_type || 'sale',
          status: p.status || 'active',
          images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
          location_text: p.location_text || p.location || '',
          created_at: p.created_at,
          updated_at: p.updated_at,
          quantity_available: p.quantity_available ?? p.stockCount ?? 0,
          specifications: p.specifications ?? null,
          shipping_policy: p.shipping_policy ?? null,
          average_rating: p.average_rating ?? p.rating ?? 0,
          review_count: p.review_count ?? p.reviews ?? 0,
          tags: p.tags || [],

          // UI-facing aliases
          name: p.title || p.name || 'Untitled Product',
          originalPrice: p.originalPrice || null,
          rating: p.average_rating ?? p.rating ?? 0,
          reviews: p.review_count ?? p.reviews ?? 0,
          seller: p.seller_name || p.seller || (p.seller_id ? String(p.seller_id).slice(0,8) : 'Unknown'),
          sellerVerified: !!p.sellerVerified,
          image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (typeof p.image === 'string' ? p.image : ''),
          category: p.category_name || p.category || '',
          featured: !!p.featured,
          discount: p.discount || 0,
          isFree: (p.price === 0) || p.isFree || false,
          stockCount: p.quantity_available ?? p.stockCount ?? 0,
          sellerDetails: p.sellerDetails ?? null,
        };

        setProduct(mapped);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch product details.',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProductAndReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);
  

  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <div className="text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn't find the product you're looking for.
        </p>
        <Button onClick={() => onNavigate('marketplace')}>
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-4 md:py-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onNavigate('marketplace')}
          className="p-0 h-auto font-normal text-xs sm:text-sm text-muted-foreground mb-4 md:mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Marketplace
        </Button>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-6 md:mb-8">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <ProductImageGallery images={product.images} productName={product.name} />
            </motion.div>
            
            <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.5, delay: 0.1 }}
            >
                <ProductPurchasePanel
                    product={product}
                    onAddToCart={onAddToCart}
                />
            </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <ProductInfoTabs product={product} reviews={reviews} onReviewSubmit={fetchProductAndReviews} />
          </div>

          <div className="lg:sticky top-24 self-start">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
             >
                <SellerInfoCard sellerDetails={product.sellerDetails} />
             </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
