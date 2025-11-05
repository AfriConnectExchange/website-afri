'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface CashOnDeliveryProps {
  onConfirm: (details: any) => void;
}

export function CashOnDelivery({ onConfirm }: CashOnDeliveryProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { profile } = useAuth();
  
  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate backend call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onConfirm({
      shippingAddress: {
        name: profile?.full_name,
        street: profile?.address,
        city: profile?.city,
        postcode: profile?.postcode,
      }
    });

    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Confirm Cash on Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-muted-foreground">You will pay the seller directly in cash when your order is delivered.</p>
        <Button onClick={handleConfirm} disabled={isProcessing} className="w-full">
          {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Confirm Order
        </Button>
      </CardContent>
    </Card>
  );
}
