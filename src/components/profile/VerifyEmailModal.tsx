"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebaseClient';
import { useAuth } from '@/context/auth-context';
import { useGlobal } from '@/lib/context/GlobalContext';

interface VerifyEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string | null;
}

export function VerifyEmailModal({ open, onOpenChange, email }: VerifyEmailModalProps) {
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const { showSnackbar } = useGlobal();
  const [status, setStatus] = useState<'idle' | 'sending' | 'polling' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setError(null);
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [open]);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken(true);
  };

  const startPolling = async (token: string) => {
    setStatus('polling');
    // Poll every 3s, timeout after 2 minutes
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch('/api/profile/check-email-verified', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json?.emailVerified) {
          setStatus('success');
          toast({ title: 'Email verified', description: 'Thanks — your email is now verified.' });
          try {
            showSnackbar('Your email was verified', 'success', 4000);
          } catch (e) {
            // ignore snackbar errors
          }
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
          // Refresh profile in auth context so UI reflects verified state
          try {
            await updateUser({});
          } catch (err) {
            console.warn('Profile refresh after verification failed:', err);
          }
          // close modal shortly after success (short delay so toast/snackbar render)
          setTimeout(() => onOpenChange(false), 300);
        }
      } catch (err) {
        console.error('poll error', err);
      }
    }, 3000);

    timeoutRef.current = window.setTimeout(() => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setStatus('error');
      setError('Verification not detected within 2 minutes. Please check your inbox and try again.');
    }, 120000);
  };

  const handleSend = async () => {
    setError(null);
    setStatus('sending');
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/profile/request-email-verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 409) {
        const json = await res.json();
        setStatus('error');
        setError(json?.error || 'Email already in use');
        return;
      }
      if (!res.ok) {
        const json = await res.json();
        setStatus('error');
        setError(json?.error || 'Failed to send verification email');
        return;
      }

      toast({ title: 'Verification sent', description: 'Check your inbox for the verification link.' });
      await startPolling(token);
    } catch (err: any) {
      console.error('send verify error', err);
      setStatus('error');
      setError(err?.message || 'Failed to send verification email');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify your email</DialogTitle>
          <DialogDescription>
            We will send a verification link to <strong>{email ?? 'your email'}</strong>. Follow the link to verify your address.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {status === 'idle' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Click the button below to send the verification email.</p>
            </div>
          )}

          {status === 'sending' && <p className="text-sm">Sending verification email…</p>}
          {status === 'polling' && <p className="text-sm">Waiting for verification — check your inbox.</p>}
          {status === 'success' && <p className="text-sm">Email verified — thank you!</p>}
          {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={status === 'sending' || status === 'polling' || status === 'success'} onClick={handleSend}>
              {status === 'sending' ? 'Sending…' : status === 'polling' ? 'Waiting…' : 'Send verification email'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VerifyEmailModal;
