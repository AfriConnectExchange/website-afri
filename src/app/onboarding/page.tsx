
'use client';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@/components/ui/loader';
import { useAuth } from '@/context/auth-context';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated } = useAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth/signin');
      }
    }, [router, isLoading, isAuthenticated]);

    if(isLoading || !user) {
         return <PageLoader />;
    }
  
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-2xl">
        <OnboardingFlow />
      </div>
    </main>
  );
}
