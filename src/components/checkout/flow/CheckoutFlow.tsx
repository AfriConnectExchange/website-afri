'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/context/cart-context';
import { Step1_Summary } from './Step1_Summary';
import { Step2_Payment } from './Step2_Payment';
import { Step3_Confirmation } from './Step3_Confirmation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export type CheckoutStep = 'summary' | 'payment' | 'confirmation';
export interface PaymentMethod {
  id: 'card' | 'paypal' | 'wallet' | 'cash';
  name: string;
  description: string;
  rank: number;
  maxAmount?: number;
}
export interface OrderResult {
  orderIds: string[];
  paymentMethod: string;
  total: number;
}

interface CheckoutFlowProps {
  cartItems: CartItem[];
  subtotal: number;
}

export function CheckoutFlow({ cartItems, subtotal }: CheckoutFlowProps) {
  const [step, setStep] = useState<CheckoutStep>('summary');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const handlePaymentSuccess = (result: OrderResult) => {
    setOrderResult(result);
    setStep('confirmation');
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('payment');
  };

  const handleBack = () => {
    if (step === 'payment') {
      setStep('summary');
      setSelectedMethod(null);
    } else {
      router.push('/cart');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'summary':
        return (
          <Step1_Summary
            cartItems={cartItems}
            subtotal={subtotal}
            onSelectMethod={handleSelectMethod}
          />
        );
      case 'payment':
        return (
          <Step2_Payment
            method={selectedMethod!}
            cartItems={cartItems}
            subtotal={subtotal}
            onPaymentSuccess={handlePaymentSuccess}
          />
        );
      case 'confirmation':
        return <Step3_Confirmation result={orderResult!} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Checkout</h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
