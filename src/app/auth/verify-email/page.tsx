'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckEmailCard from '@/components/auth/CheckEmailCard';
import { useGlobal } from '@/lib/context/GlobalContext';

export default function VerifyEmailPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const router = useRouter();
    const { showSnackbar } = useGlobal();

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
