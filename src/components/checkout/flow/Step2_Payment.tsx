'use client';

import { CartItem } from '@/context/cart-context';
import type { PaymentMethod, OrderResult } from './CheckoutFlow';
import { StripePayment } from './payment-methods/StripePayment';
import { PayPalPayment } from './payment-methods/PayPalPayment';
import { AfriConnectWalletPayment } from './payment-methods/AfriConnectWalletPayment';
import { CashOnDelivery } from './payment-methods/CashOnDelivery';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';

interface Step2_PaymentProps {
  method: PaymentMethod;
  cartItems: CartItem[];
  subtotal: number;
  onPaymentSuccess: (result: OrderResult) => void;
}

export function Step2_Payment({ method, cartItems, subtotal, onPaymentSuccess }: Step2_PaymentProps) {
  const { clearCart } = useCart();
  const { toast } = useToast();

  const handleOrderCreation = async (paymentDetails: any) => {
    try {
      const orderPayload = {
        cartItems: cartItems.map(item => ({
          product_id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          seller_id: item.seller_id,
        })),
        subtotal,
        total: subtotal, // Total is same as subtotal as per requirements
        paymentMethod: method.id,
        shippingAddress: paymentDetails.shippingAddress, // Assuming this is passed from payment forms
        payment_details: paymentDetails.transactionId ? { transaction_id: paymentDetails.transactionId } : undefined,
      };

      const response = await fetchWithAuth('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order.');
      }
      
      clearCart();
      
      onPaymentSuccess({
        orderIds: result.order_ids,
        paymentMethod: method.name,
        total: subtotal,
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Order Creation Failed',
        description: error.message,
      });
    }
  };

  switch (method.id) {
    case 'card':
      return <StripePayment onPaymentSuccess={handleOrderCreation} total={subtotal} />;
    case 'paypal':
      return <PayPalPayment onPaymentSuccess={handleOrderCreation} />;
    case 'wallet':
      return <AfriConnectWalletPayment onPaymentSuccess={handleOrderCreation} total={subtotal} />;
    case 'cash':
      return <CashOnDelivery onConfirm={handleOrderCreation} />;
    default:
      return <div>Invalid payment method selected.</div>;
  }
}
