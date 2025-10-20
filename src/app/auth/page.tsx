

"use client";

import { useEffect, useState, useRef } from 'react';
import { Logo } from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import SignInCard from '@/components/auth/SignInCard';
import SignUpCard from '@/components/auth/SignUpCard';
import CheckEmailCard from '@/components/auth/CheckEmailCard';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loader';
import OTPVerification from '@/components/auth/OTPVerification';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth, MockUser } from '@/context/auth-context';

type AuthStep = 'signin' | 'signup' | 'check-email' | 'verify-otp';

export default function AuthPage() {
  const [authStep, setAuthStep] = useState<AuthStep>('signin');
  const [emailForVerification, setEmailForVerification] = useState('');
  const [phoneForVerification, setPhoneForVerification] = useState('');
  const [resendOtp, setResendOtp] = useState<() => Promise<void>>(() => async () => {});

  const isVerifyingRef = useRef(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const handleAuthSuccess = (user: MockUser) => {
    login(user);
    router.push('/');
  }
  
  const handleNeedsOtp = (phone: string, resend: () => Promise<void>) => {
    setPhoneForVerification(phone);
    setResendOtp(() => resend);
    setAuthStep('verify-otp');
  };

  const handleOtpSuccess = (user: MockUser) => {
    // In a real app, this would come from the server after OTP is verified
    handleAuthSuccess(user);
  };

  const renderAuthStep = () => {
    switch(authStep) {
      case 'signin':
        return <SignInCard onNeedsOtp={handleNeedsOtp} onAuthSuccess={handleAuthSuccess} />;
      case 'signup':
        return <SignUpCard onNeedsOtp={handleNeedsOtp} onAuthSuccess={handleAuthSuccess} />;
      case 'verify-otp':
        return <OTPVerification 
                  phone={phoneForVerification} 
                  onAuthSuccess={handleOtpSuccess}
                  onBack={() => setAuthStep('signin')}
                  onResend={resendOtp}
                />;
      default:
        return <SignInCard onNeedsOtp={handleNeedsOtp} onAuthSuccess={handleAuthSuccess} />;
    }
  }


  // Redirect page, no UI
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
            {renderAuthStep()}
        </div>
    </div>
  );
}
