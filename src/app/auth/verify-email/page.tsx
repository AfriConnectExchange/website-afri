
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
    const [email, setEmail] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle'|'verifying'|'success'|'failed'>('idle');
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const storedEmail = localStorage.getItem('afri:pending_verification_email');
        if (storedEmail) {
            setEmail(storedEmail);
        }
        // If the verification link includes a token, call the server API and
        // show a friendly verifying -> success/failure flow in-page.
        (async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const token = params.get('token');
                if (!token) {
                    // If no token, check for redirect status param as before
                    const statusParam = params.get('status');
                    if (statusParam === 'success') {
                        toast.success('Email verified', { description: 'Your email has been verified successfully.' });
                    } else if (statusParam === 'failed') {
                        toast.error('Verification failed', { description: 'There was a problem verifying your email.' });
                    }
                    return;
                }

                setStatus('verifying');
                // Call the API route which performs token validation and activation
                const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
                if (res.ok) {
                    setStatus('success');
                    toast.success('Email verified', { description: 'Your email has been verified successfully.' });
                    setMessage('Your email has been verified. You can now sign in to your account.');
                    // clear the pending email marker
                    localStorage.removeItem('afri:pending_verification_email');
                } else {
                    const body = await res.json().catch(() => ({ message: 'Verification failed' }));
                    setStatus('failed');
                    setMessage(body?.message || 'Verification failed. The link may be invalid or expired.');
                    toast.error('Verification failed', { description: String(body?.message || 'There was a problem verifying your email.') });
                }
            } catch (err: any) {
                console.error('Client verify error:', err);
                setStatus('failed');
                setMessage('An unexpected error occurred while verifying your email.');
                toast.error('Verification error', { description: String(err?.message || err) });
            }
        })();
    }, []);

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary rounded-full p-3 w-fit mb-4">
                            <Mail className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <CardTitle>Check your email</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        {status === 'verifying' ? (
                            <p className="text-muted-foreground mb-6">Verifying your link&hellip; please wait.</p>
                        ) : status === 'success' ? (
                            <p className="text-muted-foreground mb-6">{message || 'Your email has been verified.'}</p>
                        ) : status === 'failed' ? (
                            <p className="text-destructive mb-6">{message || 'Verification failed. Please request a new link.'}</p>
                        ) : (
                            <p className="text-muted-foreground mb-6">
                                We've sent a verification link to{' '}
                                <span className="font-semibold text-foreground">{email || 'your email address'}</span>.
                                Please check your inbox (and spam folder) to complete your sign-up.
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Didn't receive the email?{' '}
                            <Link href="/auth/signup" className="underline text-primary">
                                Re-enter your email and try again
                            </Link>.
                        </p>

                        <div className="mt-8 space-y-3">
                            {status === 'success' ? (
                                <>
                                    <Button asChild variant="default">
                                        <Link href="/auth/signin">Sign in</Link>
                                    </Button>
                                    <div className="text-sm text-muted-foreground">After signing in you'll be taken through onboarding if required.</div>
                                </>
                            ) : status === 'verifying' ? (
                                <Button variant="outline" disabled>Verifying…</Button>
                            ) : (
                                <Button asChild variant="outline">
                                    <Link href="/auth/signin">Back to Sign In</Link>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
