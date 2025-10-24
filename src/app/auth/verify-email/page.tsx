
'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        const storedEmail = localStorage.getItem('afri:pending_verification_email');
        if (storedEmail) {
            setEmail(storedEmail);
        }
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
                        <p className="text-muted-foreground mb-6">
                            We've sent a verification link to{' '}
                            <span className="font-semibold text-foreground">{email || 'your email address'}</span>.
                            Please check your inbox (and spam folder) to complete your sign-up.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Didn't receive the email?{' '}
                            <Link href="/auth/signup" className="underline text-primary">
                                Re-enter your email and try again
                            </Link>.
                        </p>

                        <div className="mt-8">
                            <Button asChild variant="outline">
                                <Link href="/auth/signin">Back to Sign In</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
