'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface PayPalPaymentProps {
  onPaymentSuccess: (details: any) => void;
}

export function PayPalPayment({ onPaymentSuccess }: PayPalPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // In a real app, this would trigger the PayPal SDK pop-up.
    // We'll simulate a successful payment after a delay.
    await new Promise(resolve => setTimeout(resolve, 2000));
    onPaymentSuccess({ transactionId: `PAYPAL_${Date.now()}` });
    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <Image src="/paypal-logo.svg" alt="PayPal" width={20} height={20} />
          Pay with PayPal
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">You will be redirected to PayPal to complete your payment securely.</p>
        <Button onClick={handlePayment} disabled={isProcessing} className="w-full bg-[#0070BA] hover:bg-[#005ea6]">
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting...
            </>
          ) : (
            'Proceed to PayPal'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
