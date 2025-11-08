import React, { Suspense } from 'react';
import CheckoutSuccessClient from '@/components/checkout/CheckoutSuccessClient';

export const metadata = {
  title: 'Checkout Success',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="container max-w-2xl mx-auto py-16">Loading...</div>}>
      {/* Client component handles search params and order reconciliation */}
      <CheckoutSuccessClient />
    </Suspense>
  );
}
