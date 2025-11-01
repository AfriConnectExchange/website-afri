"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { CustomOTP } from '@/components/ui/custom-otp';
import { useGlobal } from '@/lib/context/GlobalContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { auth as clientAuth } from '@/lib/firebaseClient';
import { PhoneAuthProvider, linkWithCredential } from 'firebase/auth';

interface VerifyPhoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone?: string | null;
}

export function VerifyPhoneModal({ open, onOpenChange, phone }: VerifyPhoneModalProps) {
  const { toast } = useToast();
  const { sendPhoneOtp, resendOtp, handleOtpSuccess, updateUser } = useAuth();
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
    
    // Check if this phone is already linked to another account
    try {
      const currentUser = clientAuth.currentUser;
      if (currentUser) {
        const response = await fetch('/api/profile/check-phone-exists', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          },
          body: JSON.stringify({ phone }),
        });
        
        const data = await response.json();
        
        // If phone exists and it's not the same user, close modal and show snackbar
        if (data.exists && !data.sameUser) {
          try {
            showSnackbar('This phone number is already in use by another account. Please use a different number.', 'error', 5000);
          } catch (e) { /* ignore */ }
          onOpenChange(false);
          return;
        }
      }
    } catch (checkErr) {
      console.warn('Could not check phone uniqueness:', checkErr);
      // Continue anyway - we'll handle the error during linking if needed
    }
    
    try {
      await sendPhoneOtp(phone);
      // auth-context already shows a snackbar when OTP is sent; avoid duplicating toasts here.
      setStatus('ready');
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

      const currentUser = clientAuth.currentUser;
      const verificationId = confirmationResult.verificationId;

      if (currentUser) {
        // Strategy: Try to link the phone credential
        // If it fails because phone exists elsewhere, we'll just verify the code and update Firestore
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        
        try {
          // First, just verify the OTP code is correct by creating a credential
          // If the OTP is invalid, this will throw an error
          // If it succeeds but phone exists elsewhere, we catch that and handle it
          await linkWithCredential(currentUser, credential);
          
          // Success! Phone linked to Firebase Auth
          try {
            await currentUser.reload();
          } catch (reloadErr) {
            console.warn('Failed to reload currentUser after linking:', reloadErr);
          }

          // Update Firestore
          try {
            if (currentUser && currentUser.uid) {
              const userDocRef = doc(db, 'users', currentUser.uid);
              await updateDoc(userDocRef, { phone_verified: true, phone });
            }
          } catch (profileErr) {
            console.warn('Failed to update Firestore after linking:', profileErr);
            try { await updateUser({ phone_verified: true, phone }); } catch {}
          }

          await handleOtpSuccess(clientAuth.currentUser ?? currentUser);
          setStatus('success');
          try { showSnackbar('Phone linked and verified', 'success', 4000); } catch (e) {}
          setTimeout(() => onOpenChange(false), 400);
          return;
          
        } catch (linkErr: any) {
          console.error('Failed to link phone credential:', linkErr);
          
          // If phone exists on another account, the OTP was still validated
          // (Firebase checks the OTP before checking for duplicate phone)
          if (linkErr?.code === 'auth/account-exists-with-different-credential') {
            console.log('Phone exists on another account, updating Firestore only');
            
            try {
              // Update Firestore directly since we can't link to Firebase Auth
              if (currentUser && currentUser.uid) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userDocRef, { phone_verified: true, phone });
                
                // Update local context
                await updateUser({ phone_verified: true, phone });
                
                setStatus('success');
                try { 
                  showSnackbar('Phone verified successfully', 'success', 4000); 
                } catch (e) {}
                setTimeout(() => onOpenChange(false), 400);
                return;
              }
            } catch (updateErr: any) {
              console.error('Failed to update Firestore after phone conflict:', updateErr);
              setStatus('error');
              setError('Unable to save phone verification. Please try again.');
              return;
            }
          }
          
          // For other errors, re-throw to be caught by outer catch
          throw linkErr;
        }
      }

      // Fallback: No current user, so this is a phone-only sign-in
      const userCredential = await confirmationResult.confirm(otp);
      await handleOtpSuccess(userCredential.user);
      setStatus('success');
      try { showSnackbar('Phone verified', 'success', 4000); } catch (e) {}
      setTimeout(() => onOpenChange(false), 400);
      
    } catch (err: any) {
      console.error('OTP verify failed', err);
      setStatus('error');
      
      // Provide user-friendly error messages
      if (err?.code === 'auth/invalid-verification-code') {
        setError('Invalid code. Please check and try again.');
      } else if (err?.code === 'auth/code-expired') {
        setError('Code expired. Please request a new one.');
      } else if (err?.code === 'auth/account-exists-with-different-credential') {
        setError('This phone number is already in use by another account.');
      } else {
        setError(err?.message || 'Failed to verify code');
      }
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    try {
      // Prefer sendPhoneOtp for modal flows to avoid navigation.
      await sendPhoneOtp(phone);
      setStatus('ready');
      // auth-context already shows a snackbar for resend; avoid duplicating toasts here.
    } catch (err: any) {
      console.error('resend otp failed', err);
      setError(err?.message || 'Failed to resend OTP');
    }
  };

  // Prevent the dialog from being closed (via overlay click / Esc / programmatic)
  // while the OTP verification flow is active. Only allow closing when status === 'success'.
  const handleOpenChange = (val: boolean) => {
    if (!val && status !== 'success') {
      // ignore attempts to close while verifying
      return;
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        // Prevent closing by clicking outside the dialog (backdrop) while verifying
        onInteractOutside={(e) => e.preventDefault()}
        // Prevent closing via Escape key
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Only show the close button once verification succeeds
        closable={status === 'success'}
      >
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
            {/* Disable Cancel while OTP flow is active to avoid re-rendering reCAPTCHA and forcing resends */}
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={status !== 'success'}
            >
              Cancel
            </Button>
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
