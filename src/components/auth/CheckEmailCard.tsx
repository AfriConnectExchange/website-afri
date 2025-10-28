
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { MailCheck, Loader2 } from 'lucide-react';
import { AnimatedButton } from '../ui/animated-button';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';

interface CheckEmailCardProps {
  email?: string;
  onBack: () => void;
  isVerifying?: boolean;
}

export default function CheckEmailCard({ email: initialEmail, onBack, isVerifying = false }: CheckEmailCardProps) {
  const [email, setEmail] = useState(initialEmail || '');
  const [loadingResend, setLoadingResend] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const { showSnackbar } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    if (!initialEmail) {
      try {
        const stored = localStorage.getItem('signup_email');
        if (stored) setEmail(stored);
      } catch {}
    }
  }, [initialEmail]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
        if(user && user.emailVerified) {
            showSnackbar('Email verified! Signing you in...', 'success');
            // This will trigger the auth provider to fetch the profile
            // and redirect to onboarding or home page.
            router.push('/');
        }
    });

    return () => unsub();

  }, [router, showSnackbar]);

  const resend = async () => {
    if (!canResend) return;
    if (!auth.currentUser) {
      showSnackbar('No active user session to resend verification.', 'error');
      return;
    }
    setLoadingResend(true);
    setCanResend(false);
    try {
      await sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/auth/verify-email` });
      showSnackbar('Verification email resent. Check your inbox.', 'success');
      setTimeout(() => setCanResend(true), 60000);
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to resend verification', 'error');
      setTimeout(() => setCanResend(true), 5000);
    } finally {
      setLoadingResend(false);
    }
  };

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
          <span className="font-semibold text-foreground">{email || auth.currentUser?.email || 'your email'}</span>. Please
          check your inbox and follow the link to activate your account.
        </p>
        
        {isVerifying && (
             <div className="flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                Waiting for verification... This page will redirect automatically.
                </p>
            </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={resend}
            disabled={!canResend || loadingResend}
            className="text-primary hover:underline disabled:opacity-50"
          >
            {loadingResend ? 'Sending...' : (canResend ? 'Resend verification email' : 'Resend available in 60s')}
          </button>
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

        <p className="text-xs text-muted-foreground mt-6">
          If you're still having trouble, contact support.
        </p>
      </div>
    </div>
  );
}

    