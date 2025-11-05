'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

interface AfriConnectWalletPaymentProps {
  total: number;
  onPaymentSuccess: (details: any) => void;
}

export function AfriConnectWalletPayment({ total, onPaymentSuccess }: AfriConnectWalletPaymentProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, you would fetch the user's wallet balance from your backend
    setIsLoading(true);
    setTimeout(() => {
      setBalance((profile?.wallet_balance || 0)); // Mock balance
      setIsLoading(false);
    }, 1000);
  }, [profile]);

  const canAfford = balance !== null && balance >= total;

  const handlePayment = async () => {
    if (!canAfford) return;

    setIsProcessing(true);
    // Simulate backend wallet transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onPaymentSuccess({ transactionId: `WALLET_${Date.now()}` });
    toast({ title: 'Payment Successful', description: 'Paid with AfriConnect Wallet.' });
    
    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Pay with AfriConnect Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-muted p-4 rounded-lg text-center space-y-1">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">£{balance?.toFixed(2)}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center space-y-1">
              <p className="text-sm text-muted-foreground">Order Total</p>
              <p className="text-2xl font-bold">£{total.toFixed(2)}</p>
            </div>
            <Button onClick={handlePayment} disabled={!canAfford || isProcessing} className="w-full">
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isProcessing ? 'Processing...' : `Pay £${total.toFixed(2)}`}
            </Button>
            {!canAfford && <p className="text-destructive text-sm text-center">Insufficient balance.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
