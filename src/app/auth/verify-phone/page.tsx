
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OTPVerification from '@/components/auth/OTPVerification';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/loader';

function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const { handleOtpSuccess, resendOtp, isLoading } = useAuth();

  if (!phone && !isLoading) {
    // Redirect if there's no phone number
    router.replace('/auth/signin');
    return <PageLoader />;
  }
  
  if (isLoading) {
      return <PageLoader />
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <OTPVerification
          phone={phone}
          onAuthSuccess={(user: any) => handleOtpSuccess(user)}
          onBack={() => router.push('/auth/signin')}
          onResend={() => resendOtp(phone)}
        />
      </div>
    </div>
  );
}


export default function VerifyPhonePage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <VerifyPhoneContent />
        </Suspense>
    )
}
