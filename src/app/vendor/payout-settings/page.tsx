'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { AccountBalance, PhoneAndroid, Payment, Save, CheckCircle } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PayoutMethod = 'bank_transfer' | 'mobile_money' | 'paypal';

export default function PayoutSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState<PayoutMethod>('bank_transfer');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

  const [bankData, setBankData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    sort_code: '',
    swift_code: '',
  });

  const [mobileMoneyData, setMobileMoneyData] = useState({
    provider: 'M-Pesa',
    phone_number: '',
    account_name: '',
  });

  const [paypalData, setPaypalData] = useState({
    email: '',
  });

  useEffect(() => {
    fetchPayoutSettings();
  }, []);

  const fetchPayoutSettings = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/payout/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setActiveMethod(data.payout_method || 'bank_transfer');
        if (data.bank_account) setBankData(data.bank_account);
        if (data.mobile_money) setMobileMoneyData(data.mobile_money);
        if (data.paypal_email) setPaypalData({ email: data.paypal_email });
      }
    } catch (error) {
      console.error('Failed to fetch payout settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const token = await user?.getIdToken();
      
      const payload: any = {
        payout_method: activeMethod,
      };

      if (activeMethod === 'bank_transfer') {
        if (!bankData.bank_name || !bankData.account_name || !bankData.account_number) {
          showSnackbar('Please fill in all required bank details', 'error');
          setLoading(false);
          return;
        }
        payload.bank_account = bankData;
      } else if (activeMethod === 'mobile_money') {
        if (!mobileMoneyData.provider || !mobileMoneyData.phone_number) {
          showSnackbar('Please fill in all required mobile money details', 'error');
          setLoading(false);
          return;
        }
        payload.mobile_money = mobileMoneyData;
      } else if (activeMethod === 'paypal') {
        if (!paypalData.email) {
          showSnackbar('Please enter your PayPal email', 'error');
          setLoading(false);
          return;
        }
        payload.paypal_email = paypalData.email;
      }

      const res = await fetch('/api/payout/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showSnackbar('Payout settings saved successfully!', 'success');
      } else {
        showSnackbar(data.error || 'Failed to save settings', 'error');
      }
    } catch (error) {
      console.error('Error saving payout settings:', error);
      showSnackbar('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payout Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage how you receive payments from escrow releases
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50 mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How payouts work</p>
              <p>
                When an order is completed, funds are released from escrow and sent to your chosen payout method.
                Payouts typically process within 3-5 business days after release.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeMethod} onValueChange={(value) => setActiveMethod(value as PayoutMethod)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bank_transfer">
            <AccountBalance className="mr-2 h-4 w-4" />
            Bank Transfer
          </TabsTrigger>
          <TabsTrigger value="mobile_money">
            <PhoneAndroid className="mr-2 h-4 w-4" />
            Mobile Money
          </TabsTrigger>
          <TabsTrigger value="paypal">
            <Payment className="mr-2 h-4 w-4" />
            PayPal
          </TabsTrigger>
        </TabsList>

        {/* Bank Transfer */}
        <TabsContent value="bank_transfer">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>Enter your bank account for receiving payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bank_name">Bank Name *</Label>
                <Input
                  id="bank_name"
                  value={bankData.bank_name}
                  onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                  placeholder="e.g., Barclays, HSBC"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="account_name">Account Holder Name *</Label>
                <Input
                  id="account_name"
                  value={bankData.account_name}
                  onChange={(e) => setBankData({ ...bankData, account_name: e.target.value })}
                  placeholder="Full name as it appears on account"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account_number">Account Number *</Label>
                  <Input
                    id="account_number"
                    value={bankData.account_number}
                    onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                    placeholder="12345678"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sort_code">Sort Code *</Label>
                  <Input
                    id="sort_code"
                    value={bankData.sort_code}
                    onChange={(e) => setBankData({ ...bankData, sort_code: e.target.value })}
                    placeholder="12-34-56"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="swift_code">SWIFT/BIC Code (for international)</Label>
                <Input
                  id="swift_code"
                  value={bankData.swift_code}
                  onChange={(e) => setBankData({ ...bankData, swift_code: e.target.value })}
                  placeholder="ABCDGB2L"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Money */}
        <TabsContent value="mobile_money">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Money Details</CardTitle>
              <CardDescription>Enter your mobile money account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="provider">Provider *</Label>
                <Select
                  value={mobileMoneyData.provider}
                  onValueChange={(value) => setMobileMoneyData({ ...mobileMoneyData, provider: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                    <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                    <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                    <SelectItem value="Orange Money">Orange Money</SelectItem>
                    <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mm_phone">Phone Number *</Label>
                <Input
                  id="mm_phone"
                  value={mobileMoneyData.phone_number}
                  onChange={(e) => setMobileMoneyData({ ...mobileMoneyData, phone_number: e.target.value })}
                  placeholder="+254 712 345 678"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mm_account_name">Account Name</Label>
                <Input
                  id="mm_account_name"
                  value={mobileMoneyData.account_name}
                  onChange={(e) => setMobileMoneyData({ ...mobileMoneyData, account_name: e.target.value })}
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayPal */}
        <TabsContent value="paypal">
          <Card>
            <CardHeader>
              <CardTitle>PayPal Account</CardTitle>
              <CardDescription>Enter your PayPal email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paypal_email">PayPal Email *</Label>
                <Input
                  id="paypal_email"
                  type="email"
                  value={paypalData.email}
                  onChange={(e) => setPaypalData({ email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="mt-1"
                />
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Make sure this email is associated with a verified PayPal account.
                  PayPal charges may apply.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={loading} className="bg-black text-white">
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Payout Settings'}
        </Button>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
            snackbar.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
