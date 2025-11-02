
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
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

  const startUpgrade = async (target: 'seller' | 'sme') => {
    if (!isVerified) {
      router.push('/kyc');
      return;
    }
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
            disabled={hasSeller}
            onClick={() => startUpgrade('seller')}
            className="w-full"
          >
            {hasSeller ? 'Seller Activated' : (
              <span className="flex items-center gap-2">Upgrade to Seller <ArrowRight className="w-4 h-4" /></span>
            )}
          </Button>
          <Button
            variant={hasSME ? 'secondary' : 'outline'}
            disabled={hasSME}
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
        {!isVerified && (
          <Button onClick={() => router.push('/kyc')} variant="outline" className="w-full">
            Start KYC Verification
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
