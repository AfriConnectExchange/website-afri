
'use client';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldCheck, ArrowRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { fetchWithAuth } from '@/lib/api';

interface AccountRoleFormProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export function AccountRoleForm({ onFeedback }: AccountRoleFormProps) {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const isVerified = (profile?.verification_status === 'verified');
  const hasSeller = !!profile?.roles?.includes('seller');
  const hasSME = !!profile?.roles?.includes('sme');

  const requiredProfileFields = useMemo(() => ([
    { key: 'fullName', label: 'Full name' },
    { key: 'phone', label: 'Phone number' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'postcode', label: 'Postcode' },
    { key: 'country', label: 'Country' },
  ]), []);

  const missingProfileFields = useMemo(() => {
    if (!profile) return requiredProfileFields.map(field => field.label);
    return requiredProfileFields
      .filter(field => {
        // use 'fullName' for checks but UserProfile has 'full_name'
        const key = field.key === 'fullName' ? 'full_name' : field.key;
        const value = (profile as Record<string, any>)[key];
        return !value || (typeof value === 'string' && value.trim() === '');
      })
      .map(field => field.label);
  }, [profile, requiredProfileFields]);

  const isProfileComplete = missingProfileFields.length === 0 || !!profile?.onboarding_completed;
  const isSellerEligible = isVerified && isProfileComplete;

  const ensureSellerPrerequisites = (target: 'seller' | 'sme') => {
    if (!profile) {
      onFeedback('error', 'Unable to load your profile details. Please try again.');
      return false;
    }

    if (!isProfileComplete) {
      onFeedback('error', 'Complete your profile before upgrading.');
      router.push('/profile');
      return false;
    }

    if (!isVerified) {
      router.push('/kyc');
      return false;
    }

    if (target === 'sme' && !hasSeller) {
      onFeedback('error', 'Activate your seller account before upgrading to SME.');
      return false;
    }

    return true;
  };

  const startUpgrade = async (target: 'seller' | 'sme') => {
    if (isUpgrading) return;
    const prerequisitesMet = ensureSellerPrerequisites(target);
    if (!prerequisitesMet) return;

    try {
      setIsUpgrading(true);
      const res = await fetchWithAuth('/api/account/upgrade-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upgrade failed');
      onFeedback('success', `Upgraded to ${target.toUpperCase()} successfully. Reloading...`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (e: any) {
      onFeedback('error', e.message || 'Upgrade failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Upgrade</CardTitle>
          <CardDescription>Loading your account status…</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Upgrade</CardTitle>
        <CardDescription>Upgrade from Buyer to Seller or SME to list products and access seller tools.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProfileComplete && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <Info className="h-4 w-4 text-amber-600" />
            <div>
              <AlertTitle>Complete your profile</AlertTitle>
              <AlertDescription>
                We need a few more details before you can start selling:
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs sm:text-sm">
                  {missingProfileFields.map(field => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {!isVerified && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              Your account isn't verified yet. You'll need to complete KYC before upgrading.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant={hasSeller ? 'secondary' : 'default'}
            disabled={hasSeller || !isSellerEligible || isUpgrading}
            onClick={() => startUpgrade('seller')}
            className="w-full"
          >
            {hasSeller ? 'Seller Activated' : (
              <span className="flex items-center gap-2">Upgrade to Seller <ArrowRight className="w-4 h-4" /></span>
            )}
          </Button>
          <Button
            variant={hasSME ? 'secondary' : 'outline'}
            disabled={hasSME || !hasSeller || !isVerified || isUpgrading}
            onClick={() => startUpgrade('sme')}
            className="w-full"
          >
            {hasSME ? 'SME Activated' : (
              <span className="flex items-center gap-2">Upgrade to SME <ArrowRight className="w-4 h-4" /></span>
            )}
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {!isProfileComplete && (
            <Button onClick={() => router.push('/profile')} variant="outline" className="w-full">
              Complete Profile
            </Button>
          )}
          {!isVerified && (
            <Button onClick={() => router.push('/kyc')} variant="outline" className="w-full">
              Start KYC Verification
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
