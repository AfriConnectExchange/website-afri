
'use client';

import { useEffect, useState, Suspense } from 'react';
import { CheckoutPageComponent } from '@/components/checkout/checkout-page';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { useCart } from '@/context/cart-context';
import { PaymentConfirmation } from '@/components/checkout/payments/PaymentConfirmation';
import type { CartItem } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/ui/loader';
import { fetchWithAuth } from '@/lib/api';


function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { cart, cartCount, subtotal, clearCart } = useCart();
  
  const [paymentData, setPaymentData] = useState<any>(null);
  const [orderData, setOrderData] = useState({
    confirmedOrderItems: [] as CartItem[],
    confirmedOrderTotal: 0,
  });

  const [checkoutStep, setCheckoutStep] = useState<'summary' | 'payment' | 'confirmation'>('summary');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);

  // Shipping is determined by the seller, not the platform. This is removed.
  const total = subtotal;

  const handlePaymentSuccess = async (paymentDetails: any = {}) => {
    // This is the successful payment callback
    
    // Create the order in the database
    const orderPayload = {
      cartItems: cart.map(item => ({
        product_id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        seller_id: item.seller_id,
      })),
      subtotal,
      total,
      paymentMethod: selectedPaymentMethod?.id || 'card',
      shippingAddress: {
        street: '123 Example Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        phone: '+44 7700 900123',
      },
    };
    
    try {
      const response = await fetchWithAuth('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order.');
      }
      
      setOrderData({
        confirmedOrderItems: cart,
        confirmedOrderTotal: total,
      });

      setPaymentData({ ...result, ...paymentDetails, shipping_address: orderPayload.shippingAddress });
      clearCart();
      setCheckoutStep('confirmation');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Order Creation Failed',
            description: error.message,
        });
    }
  };

  const onNavigate = (page: string) => {
    router.push(`/${page}`);
  };
  
   useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
        handlePaymentSuccess({ stripeSessionId: sessionId });
    }
  }, [searchParams]);

   useEffect(() => {
    if (cart.length === 0 && checkoutStep !== 'confirmation' && !searchParams.get('session_id')) {
      router.push('/cart');
    }
  }, [cart, router, checkoutStep, searchParams]);

  if (searchParams.get('session_id') && checkoutStep !== 'confirmation') {
    return <PageLoader />;
  }

  if (checkoutStep === 'confirmation' && paymentData) {
    return (
        <>
            <Header cartCount={0} /> 
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                <PaymentConfirmation
                    paymentData={paymentData}
                    orderItems={orderData.confirmedOrderItems}
                    orderTotal={orderData.confirmedOrderTotal}
                    onNavigate={onNavigate}
                />
                </div>
            </div>
        </>
    );
  }

  return (
    <>
      <Header cartCount={cartCount}/>
      <CheckoutPageComponent
        cartItems={cart}
        subtotal={subtotal}
        onNavigate={onNavigate}
        onPaymentSuccess={handlePaymentSuccess}
        checkoutStep={checkoutStep}
        setCheckoutStep={setCheckoutStep}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
      />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CheckoutPageContent />
    </Suspense>
  )
}
