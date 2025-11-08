"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [sessionData, setSessionData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Verify the checkout session
    fetch(`/api/stripe/checkout-session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'complete' && data.payment_status === 'paid') {
          setSessionData(data);
          setStatus('success');

          (async () => {
            try {
              const cartItemsJson = data.metadata?.cart_items;
              if (!cartItemsJson) return;

              const cartItems = JSON.parse(cartItemsJson);

              const orderPayload = {
                cartItems: cartItems.map((it: any) => ({
                  id: it.id,
                  title: it.title,
                  quantity: it.quantity,
                  price: it.price,
                  seller_id: it.seller_id,
                  images: it.images || [],
                })),
                subtotal: (data.amount_total || 0) / 100,
                total: (data.amount_total || 0) / 100,
                paymentMethod: 'card',
                shippingAddress: data.shipping?.name ? {
                  name: data.shipping.name,
                  street: data.shipping.address?.line1,
                  city: data.shipping.address?.city,
                  postcode: data.shipping.address?.postal_code,
                  country: data.shipping.address?.country,
                } : undefined,
                payment_details: { transactionId: sessionId, stripe_session: sessionId }
              };

              if (user) {
                const resp = await fetchWithAuth('/api/orders/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(orderPayload),
                });

                if (resp.ok) {
                  toast({ title: 'Order created', description: 'Your order has been recorded.' });
                } else {
                  const err = await resp.json();
                  console.error('Failed to create orders after stripe success:', err);
                }
              } else {
                console.warn('Stripe payment succeeded but no authenticated user present — skipping server-side order creation.');
              }
            } catch (err) {
              console.error('Error creating orders from stripe session metadata:', err);
            }
          })();
        } else {
          setStatus('error');
        }
      })
      .catch(error => {
        console.error('Failed to verify session:', error);
        setStatus('error');
      });
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="container max-w-2xl mx-auto py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying your payment...</h2>
            <p className="text-muted-foreground text-center">Please wait while we confirm your order.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container max-w-2xl mx-auto py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
            <p className="text-muted-foreground text-center mb-6">We couldn't verify your payment. Please try again or contact support.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/cart')}>Back to Cart</Button>
              <Button onClick={() => router.push('/support')}>Contact Support</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-center text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Thank you for your purchase! Your order has been confirmed.</p>
            {sessionData?.customer_email && (
              <p className="text-sm text-muted-foreground">A confirmation email has been sent to <strong>{sessionData.customer_email}</strong></p>
            )}
          </div>

          {sessionData?.amount_total && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="text-xl font-bold">£{(sessionData.amount_total / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/orders')} className="w-full">View My Orders</Button>
            <Button variant="outline" onClick={() => router.push('/marketplace')} className="w-full">Continue Shopping</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
