
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CheckEmailCard from '@/components/auth/CheckEmailCard';
import { useGlobal } from '@/lib/context/GlobalContext';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { PageLoader } from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import RedirectingOverlay from '@/components/ui/RedirectingOverlay';

function VerifyEmailContent() {
    const [email, setEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(true);
    const [verificationError, setVerificationError] = useState('');
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { showSnackbar } = useGlobal();

    useEffect(() => {
        const oobCode = searchParams.get('oobCode');

        if (oobCode) {
            setIsVerifying(true);
            setVerificationError('');
            applyActionCode(auth, oobCode)
                .then(() => {
                    setVerificationSuccess(true);
                    showSnackbar({ title: 'Email Verified!', description: 'Your email has been verified. Please sign in to continue.' }, 'success');
                })
                .catch((err: any) => {
                    console.error('Email verify failed', err);
                    let message = err?.message || String(err);
                    if (err.code === 'auth/invalid-action-code') {
                        message = 'The verification link is invalid or has expired. Please request a new one.';
                    }
                    setVerificationError(message);
                    showSnackbar({ code: err?.code, description: message }, 'error');
                })
                .finally(() => {
                    setIsVerifying(false);
                });
        } else {
            // No code, user likely navigated here after signup.
            // Try to get email from localStorage to display it.
            const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('signup_email') : '';
            if (storedEmail) {
                setEmail(storedEmail);
            }
            setIsVerifying(false);
        }
    }, [searchParams, showSnackbar]);

    const handleBack = () => {
        router.push('/auth/signin');
    };
    
    if (isVerifying) {
        return <PageLoader />;
    }
    
    if(verificationSuccess) {
        // After verification, show success then redirect to sign-in with overlay
        // so the user sees confirmation and an explicit redirecting UI.
        if (!isRedirecting) {
            // Start redirect after a tiny delay so the snackbar is noticeable
            setTimeout(() => {
                setIsRedirecting(true);
                // Navigate after a short pause to let the snackbar render
                setTimeout(() => router.push('/auth/signin'), 350);
            }, 250);
        }

        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
                 <Card className="w-full max-w-md text-center">
                    <CardHeader>
                         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle>Email Verified!</CardTitle>
                        <CardDescription>Your email has been successfully verified.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push('/auth/signin')}>
                            Continue to Sign In
                        </Button>
                    </CardContent>
                </Card>
                {isRedirecting && <RedirectingOverlay />}
            </div>
        );
    }
    
    if (verificationError) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
                 <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle>Verification Failed</CardTitle>
                        <CardDescription>{verificationError}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push('/auth/signin')}>
                            Back to Sign In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <CheckEmailCard 
                email={email} 
                onBack={handleBack}
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
