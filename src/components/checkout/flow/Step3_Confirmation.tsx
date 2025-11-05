'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { OrderResult } from './CheckoutFlow';

interface Step3_ConfirmationProps {
  result: OrderResult;
}

export function Step3_Confirmation({ result }: Step3_ConfirmationProps) {
  const router = useRouter();
  
  return (
    <Card className="text-center">
      <CardContent className="pt-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
        <p className="text-muted-foreground mb-4">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        <div className="bg-muted rounded-lg p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID(s):</span>
            <span className="font-mono">{result.orderIds.join(', ').substring(0, 20)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method:</span>
            <span className="font-medium">{result.paymentMethod}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>£{result.total.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button onClick={() => router.push('/orders')} variant="outline" className="flex-1">
            <ShoppingBag className="w-4 h-4 mr-2" />
            View My Orders
          </Button>
          <Button onClick={() => router.push('/marketplace')} className="flex-1">
            Continue Shopping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
