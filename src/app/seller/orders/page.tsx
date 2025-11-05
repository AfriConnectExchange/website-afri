
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SellerOrdersPage } from '@/components/seller/orders/orders-page';

export const metadata: Metadata = {
  title: 'Orders | AfriConnect Seller',
  description: 'Monitor, confirm, and ship your AfriConnect marketplace orders.',
};

export default function SellerOrdersRoute() {
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
        <SellerOrdersPage />
      </Suspense>
    </section>
  );
}
