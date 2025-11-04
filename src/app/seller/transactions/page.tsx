import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SellerTransactionsPage } from '@/components/seller/transactions/transactions-page';

export const metadata: Metadata = {
  title: 'Transactions | AfriConnect Seller',
  description: 'Review and export every payment, escrow release, and barter record tied to your seller account.',
};

export default function SellerTransactionsRoute() {
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
        <SellerTransactionsPage />
      </Suspense>
    </section>
  );
}
