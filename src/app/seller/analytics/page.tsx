import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SellerAnalyticsPage } from '@/components/seller/analytics/analytics-page';

export const metadata: Metadata = {
  title: 'Analytics | AfriConnect Seller',
  description: 'Review revenue trends, payment mix, and product performance for your AfriConnect shop.',
};

export default function SellerAnalyticsRoute() {
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
        <SellerAnalyticsPage />
      </Suspense>
    </section>
  );
}
