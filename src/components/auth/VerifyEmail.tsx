
"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Send } from 'lucide-react';
import { AnimatedButton } from '../ui/animated-button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedEmail = localStorage.getItem('afri:pending_verification_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResend = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Error', description: 'No email address found.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend');
      toast({ title: 'Email sent', description: `A new verification link has been sent to ${email}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error resending email', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <Mail className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-lg font-semibold">Check your email</h2>
      {email ? (
        <p className="text-muted-foreground mt-2 text-sm">
          We have sent a verification link to <span className="font-semibold text-foreground">{email}</span>. Please check your inbox and click the link to activate your account.
        </p>
      ) : (
        <p className="text-muted-foreground mt-2 text-sm">
          We have sent you a verification link. Please check your inbox.
        </p>
      )}

      <div className="mt-6">
        <AnimatedButton onClick={handleResend} isLoading={isLoading} animationType='glow' size='lg' className='w-full'>
          <Send className="w-4 h-4 mr-2" />
          Resend Verification Email
        </AnimatedButton>
      </div>

      <div className="mt-6 text-sm">
        <Link href="/auth/signin" className="text-primary hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
