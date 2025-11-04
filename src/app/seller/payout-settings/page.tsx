import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PayoutSettingsForm } from '@/components/seller/payout-settings-form';

export const metadata: Metadata = {
  title: 'Payout Settings | AfriConnect Seller',
  description: 'Manage the payout method for your AfriConnect seller account.',
};

export default function PayoutSettingsPage() {
  return (
    <section className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <PayoutSettingsForm />
      </Suspense>
    </section>
  );
}
