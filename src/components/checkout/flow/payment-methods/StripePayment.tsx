'use client';

import React, { useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentProps {
    onPaymentSuccess: (details: any) => void;
    total: number;
}

export function StripePayment({ onPaymentSuccess, total }: StripePaymentProps) {
  const { toast } = useToast();
  const { cart } = useCart();
  const [showEmbeddedForm, setShowEmbeddedForm] = useState(false);

  const fetchClientSecret = useCallback(async () => {
    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: cart }),
      });
      const data = await response.json();
      if (response.ok) {
        return data.clientSecret;
      } else {
        throw new Error(data.error || 'Failed to fetch client secret');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return '';
    }
  }, [toast, cart]);

  const handleProceed = () => {
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'Cart is empty', description: 'Add items to your cart to proceed.' });
      return;
    }
    setShowEmbeddedForm(true);
  };
  
  // The onPaymentSuccess callback is not used here because Stripe's Embedded Checkout
  // handles the success state by redirecting to the `return_url`. The success page
  // (`/checkout/success`) is now responsible for handling post-payment logic.

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pay with Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showEmbeddedForm ? (
          <div id="checkout">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
          <div className="text-center space-y-4">
             <p className="text-sm text-muted-foreground">Click below to enter your card details in a secure form powered by Stripe.</p>
            <Button onClick={handleProceed} className="w-full">
              Proceed to Secure Payment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
