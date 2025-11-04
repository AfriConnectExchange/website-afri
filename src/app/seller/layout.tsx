'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Package, X } from 'lucide-react';
import { auth } from '@/lib/firebaseClient';
import { SellerNavigation } from '@/components/seller/seller-navigation';
import { SellerSidebar } from '@/components/seller/seller-sidebar';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, profile } = useAuth();
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<'loading' | 'unverified' | 'pending' | 'verified' | 'rejected'>('loading');
  const [profileComplete, setProfileComplete] = useState(false);
  const [hasSellerRole, setHasSellerRole] = useState(false);
  const [showVerifiedAlert, setShowVerifiedAlert] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem('seller-verified-alert');
    if (dismissed === 'hidden') {
      setShowVerifiedAlert(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/seller/products');
    } else if (isAuthenticated) {
      checkSellerRequirements();
    }
  }, [isLoading, isAuthenticated, router]);

  const checkSellerRequirements = async () => {
    try {
      // Determine if user already has seller/sme role
      const roles = profile?.roles || [];
      const isSeller = roles.includes('seller') || roles.includes('sme');
      setHasSellerRole(isSeller);

      // Check KYC status
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/kyc/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        const data = await res.json();
        // API returns { status: 'verified' | 'pending' | 'unverified' | 'rejected' }
        setKycStatus(data.status || 'unverified');
      }

      // Only check profile completion AFTER KYC is verified
      const isComplete = !!(
        profile?.full_name &&
        profile?.phone &&
        profile?.city &&
        profile?.postcode
      );
      setProfileComplete(isComplete);
    } catch (error) {
      console.error('Failed to check seller requirements:', error);
      setKycStatus('unverified');
    }
  };

  if (isLoading || kycStatus === 'loading') {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  // 1) Enforce KYC first for any seller access
  if (kycStatus === 'unverified' || kycStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">
              {kycStatus === 'rejected' ? 'KYC Verification Rejected' : 'Verify Your Identity'}
            </CardTitle>
            <CardDescription className="text-center">
              {kycStatus === 'rejected' 
                ? 'Your identity verification was rejected. Please resubmit with valid documents.'
                : 'Complete ID verification to start selling on AfriConnect'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                For security and compliance, all sellers must verify their identity with:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Valid government-issued ID</li>
                  <li>Proof of address (utility bill or bank statement)</li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/kyc')} className="w-full">
              {kycStatus === 'rejected' ? 'Resubmit Verification' : 'Start Verification'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2) User is KYC pending
  if (kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Verification Pending</CardTitle>
            <CardDescription className="text-center">Your KYC documents are being reviewed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your identity verification is being processed. This typically takes 24-48 hours. 
                You'll receive an email notification once your verification is complete.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3) KYC verified - ensure profile completion and role upgrade
  if (kycStatus === 'verified' && !hasSellerRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Upgrade to Seller</CardTitle>
            <CardDescription className="text-center">Your identity is verified. Upgrade your account to start selling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => router.push('/profile')} className="w-full">Upgrade Account</Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4) If profile not complete yet, prompt to complete profile (after KYC)
  if (!profileComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Complete Your Profile</CardTitle>
            <CardDescription className="text-center">You need to complete your profile before listing products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To sell on AfriConnect, please provide:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Full name</li>
                  <li>Phone number</li>
                  <li>City and postcode</li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/profile')} className="w-full">Complete Profile</Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 5) All checks passed - show seller interface
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8">
        {showVerifiedAlert && (
          <Alert className="mb-4 sm:mb-6 mx-4 sm:mx-0 border-green-200 bg-green-50 relative">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs sm:text-sm text-green-800 pr-8">
              <strong>Verified Seller</strong> - Your account is verified and ready to sell
            </AlertDescription>
            <button
              onClick={() => {
                setShowVerifiedAlert(false);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('seller-verified-alert', 'hidden');
                }
              }}
              className="absolute top-2 sm:top-3 right-2 sm:right-3 text-green-600 hover:text-green-800 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}
        <div className="flex flex-col gap-6 lg:flex-row">
          <SellerSidebar />
          <div className="flex-1 min-w-0">
            <SellerNavigation />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
