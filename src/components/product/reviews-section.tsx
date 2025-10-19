
'use client';
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { WriteReviewForm } from './write-review-form';
import { useAuth } from '@/context/auth-context';

export interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  created_at: string;
  comment: string;
  verified_purchase: boolean;
}

interface ReviewsSectionProps {
  reviews: Review[];
  productId: string;
  sellerId: string;
  onReviewSubmit: () => void;
}

export function ReviewsSection({ reviews, productId, sellerId, onReviewSubmit }: ReviewsSectionProps) {
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkPurchaseAndReviewStatus = async () => {
      if (!user) return;
      
      try {
        // This is a mock implementation. In a real app, you would:
        // 1. Fetch the user's orders that contain this productId.
        // 2. Check if a review already exists for this user and productId/orderId.
        
        // Simulating that the user purchased this item in order 'mock_order_123'
        const purchasedOrderId = 'mock_order_123';
        setOrderId(purchasedOrderId);

        // Simulating that the user has not reviewed this product yet
        const alreadyReviewed = reviews.some(review => review.reviewer_name === user.fullName);
        if (alreadyReviewed) {
             setHasReviewed(true);
             setCanReview(false);
        } else {
            setCanReview(true);
            setHasReviewed(false);
        }

      } catch(error) {
        console.error("Error checking review status:", error);
      }
    };
    checkPurchaseAndReviewStatus();
  }, [productId, user, reviews]);


  return (
    <div className="space-y-6">
      {canReview && !hasReviewed && orderId && (
        <WriteReviewForm 
            productId={productId} 
            orderId={orderId}
            sellerId={sellerId}
            onReviewSubmitted={() => {
                setHasReviewed(true);
                onReviewSubmit(); // This will re-fetch product data
            }}
        />
      )}
      {hasReviewed && (
          <div className="bg-green-50 text-green-700 text-sm p-4 rounded-md border border-green-200">
              You've already reviewed this product. Thank you for your feedback!
          </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No reviews yet for this product.</p>
        </div>
      ) : (
        reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{review.reviewer_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-1 mb-2">
                    <div className='flex items-center gap-2'>
                      <span className="font-medium text-sm">{review.reviewer_name}</span>
                      {review.verified_purchase && (
                        <Badge variant="secondary" className="text-[10px]">Verified Purchase</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
