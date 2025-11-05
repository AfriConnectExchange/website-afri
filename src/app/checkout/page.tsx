'use client';
import { Suspense } from 'react';
import { Header } from '@/components/dashboard/header';
import { CheckoutFlow } from '@/components/checkout/flow/CheckoutFlow';
import { PageLoader } from '@/components/ui/loader';
import { useCart } from '@/context/cart-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

function CheckoutPageContent() {
  const { cart, subtotal, cartCount } = useCart();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin?redirect=/checkout');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <PageLoader />;
  }
  
  if (cartCount === 0) {
      return (
          <div className="text-center py-20">
              <h2 className="text-xl font-semibold">Your cart is empty</h2>
              <p className="text-muted-foreground mt-2">Add items to your cart to proceed to checkout.</p>
              <Button onClick={() => router.push('/marketplace')} className="mt-6">
                Continue Shopping
              </Button>
          </div>
      )
  }

  return <CheckoutFlow cartItems={cart} subtotal={subtotal} />;
}

export default function CheckoutPage() {
  const { cartCount } = useCart();
  return (
    <div className="min-h-screen bg-muted/40">
      <Header cartCount={cartCount} />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<PageLoader />}>
          <CheckoutPageContent />
        </Suspense>
      </main>
    </div>
  );
}
