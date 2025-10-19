'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscrowPaymentFormProps {
  orderTotal: number;
  onConfirm: (data: any) => void;
  onCancel: () => void;
}

export function EscrowPaymentForm({ orderTotal, onConfirm, onCancel }: EscrowPaymentFormProps) {
  const [formData, setFormData] = useState({
    cardholderName: '',
    billingPostcode: '',
    agreeEscrowTerms: false,
    agreePaymentTerms: false
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const escrowFee = orderTotal * 0.025 + 0.30;
  const totalWithFees = orderTotal + escrowFee;

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardholderName) {
      newErrors.cardholderName = 'Please enter cardholder name';
    }
    if (!formData.billingPostcode) {
      newErrors.billingPostcode = 'Please enter billing postcode';
    }
    if (!formData.agreeEscrowTerms) {
      newErrors.agreeEscrowTerms = 'Please agree to escrow terms';
    }
    if (!formData.agreePaymentTerms) {
      newErrors.agreePaymentTerms = 'Please agree to payment terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    // Simulate escrow payment processing
    // In a real app, you would get a token from the Payment Element and send it to your server
    setTimeout(() => {
      const success = Math.random() > 0.05; // 95% success rate
      
      if (success) {
        onConfirm({
          paymentMethod: 'escrow',
          paymentDetails: {
            last4: '4242', // Mock data from token
            cardType: 'Visa', // Mock data from token
            escrowId: `ESC${Date.now()}`
          },
          orderTotal,
          escrowFee,
          totalPaid: totalWithFees,
          status: 'Escrowed',
          transactionId: `TXN${Date.now()}`,
          escrowReleaseConditions: {
            sellerConfirmsDelivery: false,
            buyerConfirmsReceipt: false,
            autoReleaseHours: 168 // 7 days
          }
        });
      } else {
        setErrors({ payment: 'Escrow payment failed. Please try again.' });
      }
      
      setIsProcessing(false);
    }, 2500);
  };

  const escrowSteps = [
    { step: 1, title: 'Payment Secured', description: 'Your payment is held safely in escrow', active: true },
    { step: 2, title: 'Order Processed', description: 'Seller prepares and ships your order', active: false },
    { step: 3, title: 'Delivery Confirmed', description: 'Both parties confirm successful delivery', active: false },
    { step: 4, title: 'Payment Released', description: 'Funds are transferred to the seller', active: false }
  ];
  
  const isFormValid = formData.cardholderName && formData.billingPostcode && formData.agreeEscrowTerms && formData.agreePaymentTerms;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Escrow Payment</span>
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Recommended
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How Escrow Works */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            How Escrow Protection Works
          </h4>
          <div className="space-y-3">
            {escrowSteps.map((step) => (
              <div key={step.step} className="flex items-center space-x-3">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", step.active ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600')}>
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span>Order Total:</span>
            <span>£{orderTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Escrow Protection Fee (2.5% + £0.30):</span>
            <span>£{escrowFee.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total to Pay:</span>
            <span>£{totalWithFees.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <Label className="text-base">Payment Details</Label>
          </div>
          
          {/* SECURE PAYMENT ELEMENT PLACEHOLDER */}
          <div className="space-y-2">
            <Label>Card Information</Label>
            <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background flex items-center justify-between text-muted-foreground">
              <span>Card Number, Expiry, CVV</span>
              <Lock className="w-4 h-4" />
            </div>
             <p className="text-xs text-muted-foreground">Your card details are securely handled by our payment partner.</p>
          </div>
          
          <div>
            <Label htmlFor="cardholderName">Cardholder Name *</Label>
            <Input
              id="cardholderName"
              placeholder="John Smith"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            />
            {errors.cardholderName && <p className="text-destructive text-sm mt-1">{errors.cardholderName}</p>}
          </div>

          <div>
            <Label htmlFor="billingPostcode">Billing Postcode *</Label>
            <Input
              id="billingPostcode"
              placeholder="SW1A 1AA"
              value={formData.billingPostcode}
              onChange={(e) => handleInputChange('billingPostcode', e.target.value)}
            />
            {errors.billingPostcode && <p className="text-destructive text-sm mt-1">{errors.billingPostcode}</p>}
          </div>
        </div>

        {/* Escrow Terms */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Escrow Release Conditions
            </h4>
            <ul className="text-sm space-y-1 text-blue-800">
              <li>• Funds are released when both buyer and seller confirm successful delivery.</li>
              <li>• Automatic release after 7 days if no disputes are raised.</li>
              <li>• Dispute resolution available if issues arise.</li>
              <li>• Full refund protection for non-delivery or item not as described.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="escrowTerms"
                checked={formData.agreeEscrowTerms}
                onCheckedChange={(checked) => handleInputChange('agreeEscrowTerms', !!checked)}
              />
              <Label htmlFor="escrowTerms" className="text-sm leading-relaxed">
                I understand how escrow protection works and agree to the escrow terms and conditions. *
              </Label>
            </div>
            {errors.agreeEscrowTerms && <p className="text-destructive text-sm">{errors.agreeEscrowTerms}</p>}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="paymentTerms"
                checked={formData.agreePaymentTerms}
                onCheckedChange={(checked) => handleInputChange('agreePaymentTerms', !!checked)}
              />
              <Label htmlFor="paymentTerms" className="text-sm leading-relaxed">
                I authorize this payment and agree to the payment processing terms. *
              </Label>
            </div>
            {errors.agreePaymentTerms && <p className="text-destructive text-sm">{errors.agreePaymentTerms}</p>}
          </div>
        </div>

        {/* Security Notice */}
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Maximum Protection:</strong> Your payment is secured with bank-level encryption 
            and held in a regulated escrow account until delivery is confirmed.
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {errors.payment && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errors.payment}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isProcessing}
          >
            Change Payment Method
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !isFormValid}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? 'Securing Payment...' : `Secure Pay £${totalWithFees.toFixed(2)}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
