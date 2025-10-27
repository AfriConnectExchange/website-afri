'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MailCheck, Loader2 } from 'lucide-react';
import { AnimatedButton } from '../ui/animated-button';
import { useGlobal } from '@/lib/context/GlobalContext';
import { createSPAClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initialEmail) {
      try {
        const stored = localStorage.getItem('signup_email');
        if (stored) setEmail(stored);
      } catch {}
    }
  }, [initialEmail]);

  // Poll users table for verification_status. If verified, redirect to main page.
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 24; // ~2 minutes at 5s interval
    const supabase = createSPAClient();

    const poll = async () => {
      if (!email) return;
      attempts += 1;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('verification_status')
          .ilike('email', email)
          .single();
  if (!error && (data as any)?.verification_status === 'verified') {
          showSnackbar('Email verified — signing you in or redirecting...', 'success');
          // stop polling and redirect
          if (pollingRef.current) window.clearInterval(pollingRef.current);
          // small delay so user sees message
          setTimeout(() => router.push('/'), 900);
        }
      } catch (err) {
        // ignore transient errors
      }
      if (attempts >= maxAttempts && pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };

    if (email) {
      pollingRef.current = window.setInterval(poll, 5000);
      // run first immediately
      poll();
    }

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [email, showSnackbar, router]);

  const resend = async () => {
    if (!canResend) return;
    if (!email) {
      showSnackbar('No email available to resend to.', 'error');
      return;
    }
    setLoadingResend(true);
    setCanResend(false);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend verification');
      showSnackbar('Verification email resent. Check your inbox.', 'success');
      // cooldown: 60s
      setTimeout(() => setCanResend(true), 60000);
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to resend verification', 'error');
      // allow retry sooner if failed
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
          <span className="font-semibold text-foreground">{email || 'your email'}</span>. Please
          check your inbox and follow the link to activate your account.
        </p>

        {isVerifying ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Waiting for verification... This page will redirect automatically.
            </p>
          </div>
        ) : (
          <AnimatedButton
            onClick={onBack}
            size="lg"
            className="w-full"
            variant="outline"
          >
            Back to Sign In
          </AnimatedButton>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={resend}
            disabled={!canResend || loadingResend}
            className="text-primary-600 hover:underline disabled:opacity-50"
          >
            {loadingResend ? 'Sending...' : (canResend ? 'Resend verification email' : 'Resend available in 60s')}
          </button>
          <p className="text-xs text-muted-foreground mt-2">Check your spam folder if you don't see the message.</p>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          If you're still having trouble, contact support.
        </p>
      </div>
    </div>
  );
}
