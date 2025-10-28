
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CheckEmailCard from '@/components/auth/CheckEmailCard';
import { useGlobal } from '@/lib/context/GlobalContext';
import { applyActionCode, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { PageLoader } from '@/components/ui/loader';

function VerifyEmailContent() {
    const [email, setEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(true); // Start as true if oobCode exists
    const [verificationError, setVerificationError] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const { showSnackbar } = useGlobal();

    useEffect(() => {
        const oobCode = searchParams.get('oobCode');

        if (oobCode) {
            const run = async () => {
                setIsVerifying(true);
                setVerificationError('');
                try {
                    await applyActionCode(auth, oobCode);
                    showSnackbar({ title: 'Email Verified!', description: 'Your email has been verified. Please sign in to continue.' }, 'success');
                    router.push('/auth/signin');
                } catch (err: any) {
                    console.error('Email verify failed', err);
                    let message = err?.message ?? String(err);
                    if (err.code === 'auth/invalid-action-code') {
                        message = 'The verification link is invalid or has expired. Please request a new one.';
                    }
                    setVerificationError(message);
                    showSnackbar({ code: err?.code, description: message }, 'error');
                } finally {
                    setIsVerifying(false);
                }
            };
            run();
        } else {
            // No code, user likely navigated here after signup.
            // Try to get email from localStorage to display it.
            const storedEmail = localStorage.getItem('signup_email');
            if (storedEmail) {
                setEmail(storedEmail);
            }
            setIsVerifying(false);
        }
    }, [searchParams, router, showSnackbar]);

    const handleBack = () => {
        router.push('/auth/signin');
    };
    
    if (isVerifying) {
        return <PageLoader />;
    }

    if (verificationError) {
        return (
            <CheckEmailCard 
                email={email} 
                onBack={handleBack}
                isVerifying={false} 
            />
        )
    }

    return (
        <div className="flex items-center justify-center py-12 px-4">
            <CheckEmailCard 
                email={email} 
                onBack={handleBack}
                isVerifying={isVerifying} 
            />
        </div>
    );
}


export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <VerifyEmailContent />
        </Suspense>
    )
}

    