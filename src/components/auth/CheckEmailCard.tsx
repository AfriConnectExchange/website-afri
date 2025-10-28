
"use client";

import React from 'react';
import { MailCheck } from 'lucide-react';
import { AnimatedButton } from '../ui/animated-button';

interface CheckEmailCardProps {
  email?: string;
  onBack: () => void;
}

export default function CheckEmailCard({ email, onBack }: CheckEmailCardProps) {
  
  const handleResend = () => {
    // This functionality will be handled within the verify-email page component
    // For now, this button can just be a visual placeholder if needed.
    console.log("Resend clicked");
  }

  return (
    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden w-full max-w-md">
      <div className="p-8 sm:p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <MailCheck className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-3">Check Your Email</h1>
        <p className="text-sm text-muted-foreground mb-4">
          We've sent a verification link to{' '}
          <span className="font-semibold text-foreground">{email || 'your email'}</span>. Please
          check your inbox and follow the link to activate your account.
        </p>

        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground mt-2">Check your spam folder if you don't see the message.</p>
        </div>

        <AnimatedButton
            onClick={onBack}
            size="lg"
            className="w-full mt-6"
            variant="outline"
          >
            Back to Sign In
          </AnimatedButton>
      </div>
    </div>
  );
}
