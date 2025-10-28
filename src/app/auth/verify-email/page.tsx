'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CheckEmailCard from '@/components/auth/CheckEmailCard';
import { useGlobal } from '@/lib/context/GlobalContext';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

export default function VerifyEmailPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showSnackbar } = useGlobal();

    useEffect(() => {
        const oobCode = searchParams.get('oobCode');
        if (!oobCode) return;

        const run = async () => {
            setIsVerifying(true);
            try {
                await applyActionCode(auth, oobCode);
                showSnackbar({ title: 'Email verified', description: 'Your email has been verified. Please sign in to continue.' }, 'success');
                // navigate to sign-in so user can sign in and complete onboarding
                router.push('/auth/signin');
            } catch (err: any) {
                console.error('email verify failed', err);
                showSnackbar({ code: err?.code, description: err?.message ?? String(err) }, 'error');
            } finally {
                setIsVerifying(false);
            }
        };

        run();
    }, [searchParams, router, showSnackbar]);

    const resendVerificationEmail = async () => {
        if (!email) {
            showSnackbar('Please enter your email address', 'error');
            return;
        }
        try {
            setLoading(true);
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to resend email.');
            showSnackbar('Verification email has been resent successfully.', 'success');
        } catch (err: any) {
            showSnackbar(err?.message || 'An unknown error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => router.push('/auth/signin');

    return (
        <div className="flex items-center justify-center py-12 px-4">
            <CheckEmailCard email={email} onBack={handleBack} isVerifying={isVerifying} />
            {/* keep the email input + resend controls minimal—if you want them visible, we can place them in the card */}
        </div>
    );
}
