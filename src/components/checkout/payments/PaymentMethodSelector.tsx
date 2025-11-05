
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, CreditCard, Shield, Handshake, Truck } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'online' | 'direct';
  icon: React.ReactNode;
  description: string;
  recommended?: boolean;
  maxAmount?: number;
  fees: string;
  rank: number;
}

const paymentMethods: PaymentMethod[] = [
    {
        id: 'escrow',
        name: 'Secure Escrow Payment',
        type: 'online',
        icon: <Shield className="w-5 h-5" />,
        description: 'Visa, Mastercard, etc. via Stripe',
        fees: '~2.9% + £0.30',
        rank: 1,
        recommended: true,
    },
    {
        id: 'paypal',
        name: 'PayPal',
        type: 'online',
        icon: <Image src="/paypal.svg" alt="PayPal" width={60} height={15} />,
        description: 'Pay with your PayPal account',
        fees: 'Varies',
        rank: 2,
    },
    {
      id: 'cash',
      name: 'Cash on Delivery',
      type: 'direct',
      icon: <Truck className="w-5 h-5" />,
      description: 'Pay when you receive your order',
      maxAmount: 1000,
      fees: 'Free',
      rank: 3,
    },
    {
      id: 'barter',
      name: 'Barter Exchange',
      type: 'direct',
      icon: <Handshake className="w-5 h-5" />,
      description: 'Exchange goods or services',
      fees: 'Free',
      rank: 4,
    }
];

interface PaymentMethodSelectorProps {
  orderTotal: number;
  onSelectMethod: (method: any) => void;
  selectedMethod?: string;
}

export function PaymentMethodSelector({ orderTotal, onSelectMethod, selectedMethod }: PaymentMethodSelectorProps) {

  const sortedMethods = [...paymentMethods].sort((a, b) => a.rank - b.rank);
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedMethod || sortedMethods[0]?.id);

  const handleSelect = (method: PaymentMethod) => {
    setSelectedId(method.id);
    onSelectMethod(method);
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Choose Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {sortedMethods.map(method => {
                const isDisabled = method.maxAmount && orderTotal > method.maxAmount;
                const isSelected = selectedId === method.id;

                return (
                    <div 
                        key={method.id} 
                        onClick={() => !isDisabled && handleSelect(method)} 
                        className={cn(
                            "p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between",
                            isSelected ? "border-primary ring-2 ring-primary/50" : "hover:border-primary/50",
                            isDisabled ? "opacity-50 cursor-not-allowed bg-muted/50" : ""
                        )}
                    >
                        <div className="flex items-center gap-4">
                            {method.icon}
                            <div>
                                <div className="font-medium text-sm flex items-center gap-2">
                                    {method.name}
                                    {method.recommended && <Badge className="bg-green-100 text-green-700">Recommended</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{method.description}</p>
                                {isDisabled && <p className="text-xs text-destructive mt-1">Not available for orders over £{method.maxAmount}</p>}
                            </div>
                        </div>
                        {isSelected && !isDisabled && <Check className="w-5 h-5 text-primary" />}
                    </div>
                )
            })}
        </CardContent>
    </Card>
  );
}
