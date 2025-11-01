'use client';
import { PageLoader } from '@/components/ui/loader';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SellerSidebar } from '@/components/vendor/seller-sidebar';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ArrowRight, Lock } from 'lucide-react';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showNoAccessMessage, setShowNoAccessMessage] = useState(false);
  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
  const [checkingKYC, setCheckingKYC] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Redirect to main auth if not authenticated
      if (!isAuthenticated) {
        router.push('/auth/signin?redirect=/vendor/dashboard');
      } 
      // Check if user has seller role
      else if (isAuthenticated && !(user?.roles ?? []).includes('seller')) {
        setShowNoAccessMessage(true);
      } else {
        setShowNoAccessMessage(false);
        checkKYCStatus();
      }
    }
  }, [user, isLoading, isAuthenticated, router]);

  const checkKYCStatus = async () => {
    // Allow KYC page itself and settings pages without KYC check
    if (pathname === '/vendor/kyc' || pathname === '/vendor/payout-settings' || pathname === '/vendor/shop-settings') {
      setCheckingKYC(false);
      return;
    }

    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/kyc/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setKycStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error);
    } finally {
      setCheckingKYC(false);
    }
  };

  if (isLoading || checkingKYC) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  // Show message if user doesn't have seller role
  if (showNoAccessMessage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Become a Vendor</CardTitle>
            <CardDescription>
              You need to have a vendor account to access the Vendor Center.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Start selling on AfriConnect Exchange and reach thousands of customers looking for authentic African products.
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => {
                  // TODO: Create a "become a seller" flow
                  // For now, just go to home
                  router.push('/');
                }}
              >
                Learn More About Selling
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/')}
              >
                Back to Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KYC Gate: Block access to product creation if not verified
  const kycGatedPages = ['/vendor/add-product', '/vendor/products'];
  const isKYCGatedPage = kycGatedPages.some(page => pathname?.startsWith(page));
  
  if (isKYCGatedPage && kycStatus !== 'verified') {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <SellerSidebar />
        <div className="flex flex-col">
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="max-w-lg border-orange-200 bg-orange-50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-orange-900">KYC Verification Required</CardTitle>
                  <CardDescription className="text-orange-800">
                    Complete identity verification to create product listings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-gray-700 mb-3">
                      To ensure a safe marketplace and comply with regulations, all sellers must verify their identity before listing products.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Quick verification process (5 minutes)</li>
                      <li>✓ Your data is securely encrypted</li>
                      <li>✓ Review typically completes in 24-48 hours</li>
                    </ul>
                  </div>
                  {kycStatus === 'pending' && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <p className="text-sm text-yellow-900">
                        <strong>Status:</strong> Your verification is currently under review. We'll notify you once it's complete.
                      </p>
                    </div>
                  )}
                  {kycStatus === 'rejected' && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                      <p className="text-sm text-red-900">
                        <strong>Action Required:</strong> Your verification was rejected. Please resubmit your documents.
                      </p>
                    </div>
                  )}
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700" 
                    size="lg"
                    onClick={() => router.push('/vendor/kyc')}
                    disabled={kycStatus === 'pending'}
                  >
                    {kycStatus === 'pending' ? 'Verification Pending' : 'Start Verification'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SellerSidebar />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}