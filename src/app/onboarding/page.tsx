'use client';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { useAuth } from '@/context/auth-context';
import { PageLoader } from '@/components/ui/loader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const { user, isLoading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/auth/signin');
      } else if (profile?.onboarding_completed) {
        router.replace('/');
      }
    }
  }, [user, profile, isLoading, router]);

  if (isLoading || !user || profile?.onboarding_completed) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <OnboardingFlow onComplete={() => router.push('/')} />
    </div>
  );
}
