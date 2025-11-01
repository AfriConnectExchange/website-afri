'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Save, Store, Payment, LocalShipping, Description } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

export default function ShopSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'shop' | 'payments' | 'shipping' | 'policies'>('shop');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

  const [sellerData, setSellerData] = useState({
    business_name: '',
    seller_bio: '',
    contact_email: '',
    contact_phone: '',
    business_address: '',
  });

  const [paymentData, setPaymentData] = useState({
    accepts_cash: true,
    accepts_card: false,
    accepts_bank_transfer: true,
    accepts_mobile_money: false,
    paypal_email: '',
    stripe_account_id: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
  });

  const [shippingData, setShippingData] = useState({
    default_shipping_cost: 0,
    free_shipping_threshold: 0,
    domestic_shipping: true,
    international_shipping: false,
    processing_time_days: 3,
    return_policy_days: 14,
    allows_returns: true,
  });

  const [policiesData, setPoliciesData] = useState({
    terms_of_service: '',
    return_policy: '',
    privacy_policy: '',
  });

  useEffect(() => {
    fetchShopSettings();
  }, []);

  const fetchShopSettings = async () => {
    // TODO: Fetch from Firestore
    console.log('Fetching shop settings...');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save to Firestore based on active tab
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showSnackbar('Settings saved successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 3000);
  };

  const tabs = [
    { id: 'shop', label: 'Seller Info', icon: <Store className="h-5 w-5" /> },
    { id: 'payments', label: 'Payment Methods', icon: <Payment className="h-5 w-5" /> },
    { id: 'shipping', label: 'Shipping', icon: <LocalShipping className="h-5 w-5" /> },
    { id: 'policies', label: 'Policies', icon: <Description className="h-5 w-5" /> },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Seller Settings</h1>
        <p className="text-gray-600 mt-1">Manage your seller profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-black text-black font-medium'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border rounded-lg p-6">
        {/* Seller Info Tab */}
        {activeTab === 'shop' && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={sellerData.business_name}
                onChange={(e) => setSellerData({ ...sellerData, business_name: e.target.value })}
                placeholder="Your business or personal name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="seller_bio">About Your Business</Label>
              <Textarea
                id="seller_bio"
                value={sellerData.seller_bio}
                onChange={(e) => setSellerData({ ...sellerData, seller_bio: e.target.value })}
                placeholder="Tell buyers about yourself and your products..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={sellerData.contact_email}
                  onChange={(e) => setSellerData({ ...sellerData, contact_email: e.target.value })}
                  placeholder="contact@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={sellerData.contact_phone}
                  onChange={(e) => setSellerData({ ...sellerData, contact_phone: e.target.value })}
                  placeholder="+44 123 456 7890"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="business_address">Business Address</Label>
              <Textarea
                id="business_address"
                value={sellerData.business_address}
                onChange={(e) => setSellerData({ ...sellerData, business_address: e.target.value })}
                placeholder="Your business address"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> These are the payment methods you accept FROM buyers. Configure how you receive payouts in the "Payout Settings" page.
              </p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Accept Payment Methods</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cash"
                    checked={paymentData.accepts_cash}
                    onCheckedChange={(checked) =>
                      setPaymentData({ ...paymentData, accepts_cash: checked as boolean })
                    }
                  />
                  <Label htmlFor="cash">Cash on Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="card"
                    checked={paymentData.accepts_card}
                    onCheckedChange={(checked) =>
                      setPaymentData({ ...paymentData, accepts_card: checked as boolean })
                    }
                  />
                  <Label htmlFor="card">Card Payments (via Stripe)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bank"
                    checked={paymentData.accepts_bank_transfer}
                    onCheckedChange={(checked) =>
                      setPaymentData({ ...paymentData, accepts_bank_transfer: checked as boolean })
                    }
                  />
                  <Label htmlFor="bank">Bank Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobile"
                    checked={paymentData.accepts_mobile_money}
                    onCheckedChange={(checked) =>
                      setPaymentData({ ...paymentData, accepts_mobile_money: checked as boolean })
                    }
                  />
                  <Label htmlFor="mobile">Mobile Money</Label>
                </div>
              </div>
            </div>

            {paymentData.accepts_bank_transfer && (
              <div className="space-y-4 border-t pt-6">
                <Label className="text-base font-semibold">Bank Details</Label>
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={paymentData.bank_name}
                    onChange={(e) => setPaymentData({ ...paymentData, bank_name: e.target.value })}
                    placeholder="e.g., Barclays"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="account_name">Account Name</Label>
                  <Input
                    id="account_name"
                    value={paymentData.bank_account_name}
                    onChange={(e) => setPaymentData({ ...paymentData, bank_account_name: e.target.value })}
                    placeholder="Account holder name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={paymentData.bank_account_number}
                    onChange={(e) => setPaymentData({ ...paymentData, bank_account_number: e.target.value })}
                    placeholder="12345678"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_shipping">Default Shipping Cost (£)</Label>
                <Input
                  id="default_shipping"
                  type="number"
                  value={shippingData.default_shipping_cost}
                  onChange={(e) =>
                    setShippingData({ ...shippingData, default_shipping_cost: parseFloat(e.target.value) })
                  }
                  placeholder="5.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="free_threshold">Free Shipping Threshold (£)</Label>
                <Input
                  id="free_threshold"
                  type="number"
                  value={shippingData.free_shipping_threshold}
                  onChange={(e) =>
                    setShippingData({ ...shippingData, free_shipping_threshold: parseFloat(e.target.value) })
                  }
                  placeholder="50.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="processing_time">Processing Time (days)</Label>
              <Input
                id="processing_time"
                type="number"
                value={shippingData.processing_time_days}
                onChange={(e) =>
                  setShippingData({ ...shippingData, processing_time_days: parseInt(e.target.value) })
                }
                placeholder="3"
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="domestic"
                  checked={shippingData.domestic_shipping}
                  onCheckedChange={(checked) =>
                    setShippingData({ ...shippingData, domestic_shipping: checked as boolean })
                  }
                />
                <Label htmlFor="domestic">Domestic Shipping (UK)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="international"
                  checked={shippingData.international_shipping}
                  onCheckedChange={(checked) =>
                    setShippingData({ ...shippingData, international_shipping: checked as boolean })
                  }
                />
                <Label htmlFor="international">International Shipping</Label>
              </div>
            </div>

            <div className="border-t pt-6">
              <Label className="text-base font-semibold mb-3 block">Returns</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="returns"
                    checked={shippingData.allows_returns}
                    onCheckedChange={(checked) =>
                      setShippingData({ ...shippingData, allows_returns: checked as boolean })
                    }
                  />
                  <Label htmlFor="returns">Accept Returns</Label>
                </div>
                {shippingData.allows_returns && (
                  <div>
                    <Label htmlFor="return_days">Return Window (days)</Label>
                    <Input
                      id="return_days"
                      type="number"
                      value={shippingData.return_policy_days}
                      onChange={(e) =>
                        setShippingData({ ...shippingData, return_policy_days: parseInt(e.target.value) })
                      }
                      placeholder="14"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="terms">Terms of Service</Label>
              <Textarea
                id="terms"
                value={policiesData.terms_of_service}
                onChange={(e) => setPoliciesData({ ...policiesData, terms_of_service: e.target.value })}
                placeholder="Your shop's terms of service..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="return_policy">Return Policy</Label>
              <Textarea
                id="return_policy"
                value={policiesData.return_policy}
                onChange={(e) => setPoliciesData({ ...policiesData, return_policy: e.target.value })}
                placeholder="Describe your return policy..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="privacy">Privacy Policy</Label>
              <Textarea
                id="privacy"
                value={policiesData.privacy_policy}
                onChange={(e) => setPoliciesData({ ...policiesData, privacy_policy: e.target.value })}
                placeholder="Your privacy policy..."
                rows={6}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-6 border-t">
          <Button onClick={handleSave} disabled={loading} className="bg-black text-white">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
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
