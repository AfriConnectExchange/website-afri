'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface BankAccountForm {
  account_holder_name: string;
  bank_name: string;
  sort_code: string;
  account_number: string;
  iban: string;
}

type PayoutMethod = 'bank_transfer' | 'paypal';

type PayoutSettingsResponse = {
  success: boolean;
  payout_method?: PayoutMethod;
  bank_account?: BankAccountForm | null;
  paypal_email?: string | null;
};

const methodLabels: Record<PayoutMethod, string> = {
  bank_transfer: 'Bank transfer',
  paypal: 'PayPal',
};

export function PayoutSettingsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMethod, setActiveMethod] = useState<PayoutMethod | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccountForm>({
    account_holder_name: '',
    bank_name: '',
    sort_code: '',
    account_number: '',
    iban: '',
  });
  const [paypalEmail, setPaypalEmail] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetchWithAuth('/api/payout/settings');
        const data: PayoutSettingsResponse = await response.json();
        if (response.ok && data.success) {
          if (data.payout_method) {
            setActiveMethod(data.payout_method);
          }
          if (data.bank_account) {
            setBankAccount({
              account_holder_name: data.bank_account.account_holder_name || '',
              bank_name: data.bank_account.bank_name || '',
              sort_code: data.bank_account.sort_code || '',
              account_number: data.bank_account.account_number || '',
              iban: data.bank_account.iban || '',
            });
          }
          if (data.paypal_email) {
            setPaypalEmail(data.paypal_email);
          }
        } else if (!response.ok) {
          throw new Error((data as any)?.error || 'Unable to load payout settings');
        }
      } catch (error: any) {
        console.error('Failed to load payout settings:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load payout settings',
          description: error.message || 'Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const validationErrors = useMemo(() => {
    if (!activeMethod) return ['Select a payout method'];

    if (activeMethod === 'bank_transfer') {
      const required: Array<[keyof BankAccountForm, string]> = [
        ['account_holder_name', 'Account holder name'],
        ['bank_name', 'Bank name'],
        ['sort_code', 'Sort code'],
        ['account_number', 'Account number'],
      ];
      return required
        .filter(([key]) => !bankAccount[key] || bankAccount[key].trim() === '')
        .map(([, label]) => label);
    }

    if (activeMethod === 'paypal') {
      if (!paypalEmail || paypalEmail.trim() === '') {
        return ['PayPal email address'];
      }
      const isValidEmail = /.+@.+\..+/.test(paypalEmail);
      return isValidEmail ? [] : ['Enter a valid PayPal email'];
    }

    return [];
  }, [activeMethod, bankAccount, paypalEmail]);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    if (validationErrors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: `Please complete: ${validationErrors.join(', ')}`,
      });
      return;
    }

    if (!activeMethod) return;

    try {
      setIsSaving(true);
      const payload: Record<string, unknown> = {
        payout_method: activeMethod,
      };

      if (activeMethod === 'bank_transfer') {
        payload.bank_account = bankAccount;
      } else if (activeMethod === 'paypal') {
        payload.paypal_email = paypalEmail;
      }

      const response = await fetchWithAuth('/api/payout/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast({
        title: 'Payout settings saved',
        description: 'Your payout method has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Failed to save payout settings:', error);
      toast({
        variant: 'destructive',
        title: 'Unable to save settings',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payout Settings</CardTitle>
        <CardDescription>
          Choose how you would like AfriConnect to send your payouts. Funds are released once orders are completed and disputes, if any, are resolved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={saveSettings} className="space-y-6">
          <div className="space-y-3">
            <Alert className="border-blue-200 bg-blue-50 text-blue-900">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <div>
                <AlertTitle>Compliance notice</AlertTitle>
                <AlertDescription className="text-sm">
                  AfriConnect collects buyer payments into platform escrow. Add accurate payout details so released funds land in the right account. Bank transfers go directly to the account you enter; PayPal payouts use the email you provide.
                </AlertDescription>
              </div>
            </Alert>

            <div>
              <Label className="text-sm font-medium mb-2 block">Select payout method</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {(Object.keys(methodLabels) as PayoutMethod[]).map(method => {
                  const isActive = activeMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setActiveMethod(method)}
                      className={
                        'flex h-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-px hover:shadow-sm ' +
                        (isActive
                          ? 'border-primary bg-primary text-primary-foreground shadow'
                          : 'border-border bg-white text-foreground')
                      }
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold capitalize">
                        {method === 'paypal' ? (
                          <>
                            <span className="sr-only">PayPal</span>
                            <span className="relative h-5 w-20">
                              <Image
                                src="/images/paypal-logo.svg"
                                alt="PayPal"
                                fill
                                sizes="80px"
                                className="object-contain"
                              />
                            </span>
                          </>
                        ) : (
                          methodLabels[method]
                        )}
                      </span>
                      <span className="text-xs leading-snug opacity-80">
                        {method === 'bank_transfer' && 'Receive payouts straight to your UK business or personal bank account'}
                        {method === 'paypal' && 'Withdraw to your PayPal balance using your registered email address'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {activeMethod === 'bank_transfer' && (
            <div className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                <div>
                  <AlertTitle>Bank payouts</AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm">
                    Payouts leave AfriConnect’s Stripe account and land in the UK bank details you provide. Double-check spelling to avoid failed transfers. We’ll soon add automatic verification via Open Banking.
                  </AlertDescription>
                </div>
              </Alert>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bank_account_holder">Account holder name</Label>
                  <Input
                    id="bank_account_holder"
                    value={bankAccount.account_holder_name}
                    onChange={event => setBankAccount(prev => ({ ...prev, account_holder_name: event.target.value }))}
                    placeholder="Name registered on the account"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank name</Label>
                  <Input
                    id="bank_name"
                    value={bankAccount.bank_name}
                    onChange={event => setBankAccount(prev => ({ ...prev, bank_name: event.target.value }))}
                    placeholder="Barclays, Monzo, HSBC…"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_sort_code">Sort code</Label>
                  <Input
                    id="bank_sort_code"
                    value={bankAccount.sort_code}
                    onChange={event => setBankAccount(prev => ({ ...prev, sort_code: event.target.value }))}
                    placeholder="XX-XX-XX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Account number</Label>
                  <Input
                    id="bank_account_number"
                    value={bankAccount.account_number}
                    onChange={event => setBankAccount(prev => ({ ...prev, account_number: event.target.value }))}
                    placeholder="8-digit UK account number"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bank_iban">IBAN (optional)</Label>
                  <Input
                    id="bank_iban"
                    value={bankAccount.iban}
                    onChange={event => setBankAccount(prev => ({ ...prev, iban: event.target.value }))}
                    placeholder="GB00 BUKB 0000 0000 0000 00"
                  />
                </div>
              </div>
            </div>
          )}

          {activeMethod === 'paypal' && (
            <div className="space-y-2 max-w-md">
              <Label htmlFor="paypal_email">PayPal email</Label>
              <Input
                id="paypal_email"
                type="email"
                value={paypalEmail}
                onChange={event => setPaypalEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Bank transfers typically settle within 2 business days after escrow release; PayPal payouts depend on PayPal’s settlement window.
            </div>
            <Button type="submit" disabled={isSaving || !activeMethod} className="sm:w-auto w-full">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save payout settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
