'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Shield, Handshake, Truck, Wallet } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from './CheckoutFlow';

interface PaymentMethodSelectorProps {
  orderTotal: number;
  onSelectMethod: (method: PaymentMethod) => void;
}

const allPaymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Secure payment via Stripe',
    rank: 1,
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    rank: 2,
    icon: <Image src="/paypal-logo.svg" alt="PayPal" width={20} height={20} />,
  },
  {
    id: 'wallet',
    name: 'AfriConnect Wallet',
    description: 'Use your internal wallet balance',
    rank: 3,
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    id: 'cash',
    name: 'Cash on Delivery',
    description: 'Pay the seller in person',
    rank: 4,
    maxAmount: 1000,
    icon: <Truck className="w-5 h-5" />,
  },
];

export function PaymentMethodSelector({ orderTotal, onSelectMethod }: PaymentMethodSelectorProps) {

  // FR03: Rank payment options and filter out invalid ones
  const availableMethods = allPaymentMethods
    .filter(method => !(method.maxAmount && orderTotal > method.maxAmount))
    .sort((a, b) => a.rank - b.rank);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableMethods.map(method => (
          <div
            key={method.id}
            onClick={() => onSelectMethod(method)}
            className="p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between hover:border-primary/50"
          >
            <div className="flex items-center gap-4">
              {method.icon}
              <div>
                <div className="font-medium text-sm">{method.name}</div>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
