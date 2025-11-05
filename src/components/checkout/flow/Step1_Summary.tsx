'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, MapPin, Truck } from 'lucide-react';
import { CartItem } from '@/context/cart-context';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import type { PaymentMethod } from './CheckoutFlow';
import { useAuth } from '@/context/auth-context';

interface Step1_SummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  onSelectMethod: (method: PaymentMethod) => void;
}

export function Step1_Summary({ cartItems, subtotal, onSelectMethod }: Step1_SummaryProps) {
  const { profile } = useAuth();
  
  const shippingAddress = {
    name: profile?.full_name || 'N/A',
    street: profile?.address || 'Address not set',
    city: profile?.city || '',
    postcode: profile?.postcode || '',
    country: profile?.country || '',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Order Items ({cartItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <ImageWithFallback src={item.image || ''} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">£{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{shippingAddress.name}</p>
            <p className="text-sm text-muted-foreground">{shippingAddress.street}</p>
            <p className="text-sm text-muted-foreground">{shippingAddress.city}, {shippingAddress.postcode}</p>
            <Separator className="my-4" />
             <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3">
              <Truck className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-xs">
                Shipping costs are set by individual sellers and will be confirmed after your order is placed. The platform does not manage shipping.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Select Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodSelector orderTotal={subtotal} onSelectMethod={onSelectMethod} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
