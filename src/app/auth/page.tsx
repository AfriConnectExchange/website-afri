

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
import { useAuth } from '@/context/auth-context';


type AuthStep = 'signin' | 'signup' | 'check-email' | 'verify-otp';

export default function AuthPage() {
  const [authStep, setAuthStep] = useState<AuthStep>('signin');
  const [emailForVerification, setEmailForVerification] = useState('');
  const [phoneForVerification, setPhoneForVerification] = useState('');
  const [resendOtp, setResendOtp] = useState<() => Promise<void>>(() => async () => {});

  const router = useRouter();
  const { toast } = useToast();
  const { handleNeedsOtp, handleOtpSuccess } = useAuth() as any; // Use `as any` to access new methods
  
  useEffect(() => {
    // This effect now correctly wires up the OTP handling from the context
    const otpNeededHandler = ({ phone, resend }: { phone: string, resend: () => Promise<void> }) => {
        setPhoneForVerification(phone);
        setResendOtp(() => resend); // Store the resend function
        setAuthStep('verify-otp');
    };
    
    // Assumes `auth-context` uses a simple event emitter or callback system for this
    handleNeedsOtp(otpNeededHandler);

  }, [handleNeedsOtp]);


  const renderAuthStep = () => {
    switch(authStep) {
      case 'signin':
        return <SignInCard />;
      case 'signup':
        return <SignUpCard />;
      case 'verify-otp':
        return <OTPVerification 
                  phone={phoneForVerification} 
                  onAuthSuccess={(user: any) => handleOtpSuccess(user)}
                  onBack={() => setAuthStep('signin')}
                  onResend={resendOtp}
                />;
      default:
        return <SignInCard />;
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
