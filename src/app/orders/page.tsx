
'use client';
import { Header } from '@/components/dashboard/header';
import { MyOrdersPage } from '@/components/orders/my-orders-page';
import { PageLoader } from '@/components/ui/loader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export default function OrdersPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/orders');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
            <MyOrdersPage />
        </div>
      </main>
    </div>
  );
}
