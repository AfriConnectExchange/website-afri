import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SellerReviewsPage } from '@/components/seller/reviews/reviews-page';

export const metadata: Metadata = {
  title: 'Reviews | AfriConnect Seller',
  description: 'Track buyer feedback and respond directly from your seller workspace.',
};

export default function SellerReviewsRoute() {
  return (
    <section className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <SellerReviewsPage />
      </Suspense>
    </section>
  );
}
