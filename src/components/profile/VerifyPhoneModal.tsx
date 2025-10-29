"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { CustomOTP } from '@/components/ui/custom-otp';
import { useGlobal } from '@/lib/context/GlobalContext';

interface VerifyPhoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone?: string | null;
}

export function VerifyPhoneModal({ open, onOpenChange, phone }: VerifyPhoneModalProps) {
  const { toast } = useToast();
  const { sendPhoneOtp, resendOtp, handleOtpSuccess } = useAuth();
  const { showSnackbar } = useGlobal();
  const [status, setStatus] = useState<'idle' | 'sending' | 'ready' | 'verifying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setError(null);
    }
  }, [open]);

  const start = async () => {
    if (!phone) return setError('No phone number provided');
    setError(null);
    setStatus('sending');
    try {
      await sendPhoneOtp(phone);
      setStatus('ready');
      toast({ title: 'OTP Sent', description: `A one-time code was sent to ${phone}.` });
    } catch (err: any) {
      console.error('start phone verify error', err);
      setStatus('error');
      setError(err?.message || 'Failed to send OTP');
    }
  };

  useEffect(() => {
    if (open) {
      // Kick off the phone auth flow when the modal opens
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleComplete = async (otp: string) => {
    setStatus('verifying');
    try {
      const confirmationResult = (window as any).confirmationResult;
      if (!confirmationResult) throw new Error('No confirmation session. Please resend OTP.');
      const userCredential = await confirmationResult.confirm(otp);
      await handleOtpSuccess(userCredential.user);
      setStatus('success');
      try { showSnackbar('Phone verified', 'success', 4000); } catch (e) { /* ignore */ }
      setTimeout(() => onOpenChange(false), 400);
    } catch (err: any) {
      console.error('OTP verify failed', err);
      setStatus('error');
      setError(err?.message || 'Failed to verify code');
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    try {
      // Prefer sendPhoneOtp for modal flows to avoid navigation.
      await sendPhoneOtp(phone);
      setStatus('ready');
      toast({ title: 'OTP Resent', description: `A new code has been sent to ${phone}.` });
    } catch (err: any) {
      console.error('resend otp failed', err);
      setError(err?.message || 'Failed to resend OTP');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify your phone</DialogTitle>
          <DialogDescription>
            We will send an OTP to <strong>{phone ?? 'your phone'}</strong>. Enter the 6-digit code to verify.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {status === 'sending' && <p className="text-sm">Sending OTP…</p>}
          {(status === 'ready' || status === 'verifying' || status === 'error') && (
            <CustomOTP
              phone={phone ?? ''}
              isLoading={status === 'verifying'}
              onComplete={handleComplete}
              onResend={handleResend}
            />
          )}
          {status === 'success' && <p className="text-sm">Phone verified — thank you!</p>}
          {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={status === 'sending' || status === 'verifying' || status === 'success'} onClick={() => start()}>
              {status === 'sending' ? 'Sending…' : status === 'verifying' ? 'Verifying…' : 'Resend OTP'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VerifyPhoneModal;
