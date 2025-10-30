

'use client';
import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { AnimatedButton } from '../ui/animated-button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RedirectingOverlay from '@/components/ui/RedirectingOverlay';
interface Props {
  phone: string;
  // Use a loose type here during migration; we'll normalize to AppUser once OTP
  // verification is implemented with Firebase.
  onAuthSuccess: (user: any) => void;
  onBack: () => void;
  onResend: () => Promise<void>;
}

export function OTPVerification({ phone, onAuthSuccess, onBack, onResend }: Props) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);


  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^[0-9]$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== '' && index < 5) {
        inputsRef.current[index + 1]?.focus();
      }
      
      const completeOtp = newOtp.join('');
      if(completeOtp.length === 6) {
        handleOtpVerification(completeOtp);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };
  
  const handleOtpVerification = async (otpValue: string) => {
    setIsLoading(true);
    try {
      const confirmationResult = (window as any).confirmationResult;
      if (!confirmationResult) {
        throw new Error('Verification session expired. Please try again.');
      }
      const userCredential = await confirmationResult.confirm(otpValue);
      // Show redirecting overlay and wait for the auth context to finish
      // session handling/navigation so the UI remains disabled until redirect.
      setIsRedirecting(true);
      try {
        await onAuthSuccess(userCredential.user);
      } finally {
        // If navigation didn't happen for some reason, clear redirecting state
        setIsRedirecting(false);
      }
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
       setIsLoading(false);
    }
  }
  
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
    await onResend();
    setResendCooldown(30); // Reset cooldown
    // Global snackbar (auth context) shows OTP sent; avoid duplicating toasts here.
    } catch (error) {
        // Error is already handled in the onResend implementation (SignIn/Up cards)
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden w-full max-w-md">
        <div className="p-8 sm:p-10 text-center relative">
         {isRedirecting && <RedirectingOverlay />}
         <AnimatedButton
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </AnimatedButton>
          <h2 className="text-2xl font-bold mb-2 pt-8">Verify Your Phone</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Enter the 6-digit code sent to {phone}.
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputsRef.current[index] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-semibold bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary transition"
              />
            ))}
          </div>
          
          <AnimatedButton
            onClick={() => handleOtpVerification(otp.join(''))}
            isLoading={isLoading}
            disabled={otp.some(digit => digit === '')}
            className="w-full"
            animationType="glow"
          >
            Verify
          </AnimatedButton>

          <div className="mt-4 text-sm">
            Didn't receive the code?{' '}
            <button onClick={handleResendOTP} disabled={isLoading || resendCooldown > 0} className="text-primary hover:underline font-semibold disabled:text-muted-foreground disabled:cursor-not-allowed">
              Resend OTP {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
            </button>
          </div>
        </div>
    </div>
  );
}
export default OTPVerification;
