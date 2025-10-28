
'use client';
import { Header } from '@/components/dashboard/header';
import { MyOrdersPage } from '@/components/orders/my-orders-page';
import { PageLoader } from '@/components/ui/loader';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-muted/40">
        <Header />
        <main className="flex-1 p-4 md:gap-8 md:p-8">
            <MyOrdersPage />
        </main>
    </div>
  )
}
