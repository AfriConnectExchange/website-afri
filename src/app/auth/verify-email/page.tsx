'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {useState, useEffect} from "react";
import CheckEmailCard from '@/components/auth/CheckEmailCard';
import { createSPAClient } from '@/lib/supabase/client';

export default function VerifyEmailPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const resendVerificationEmail = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'verify-email' }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to resend email.');
            }
            
            setSuccess(true);
        } catch (err: Error | unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        try {
            const pending = localStorage.getItem('afri:pending_verification_email');
            if (pending) setEmail(pending);
        } catch (e) {}
    }, []);

    useEffect(() => {
        if (!email) return;
        let mounted = true;
        const supabase = createSPAClient();

        const checkVerified = async () => {
            setIsVerifying(true);
            try {
                const { data: { user }, error: userErr } = await supabase.auth.getUser();
                if (!mounted) return;

                if (user && (user.email === email) && (user.email_confirmed_at)) {
                    setSuccess(true);
                    setIsVerifying(false);
                    try { localStorage.removeItem('afri:pending_verification_email'); } catch (e) {}
                    // short delay so user sees the success state
                    setTimeout(() => { window.location.href = '/'; }, 1100);
                    return;
                }
            } catch (e) {
                // ignore transient errors
            }
            setIsVerifying(true);
        };

        const id = setInterval(checkVerified, 3000);
        checkVerified();
        return () => { mounted = false; clearInterval(id); };
    }, [email]);

    return (
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Check your email
                </h2>

                {/* Show a waiting card while polling. The user can still manually enter email and resend below. */}
                <div className="space-y-4">
                    {isVerifying || !success ? (
                        <div className="mt-6">
                            <CheckEmailCard email={email || ''} onBack={() => window.location.href = '/auth/signin'} isVerifying={isVerifying} />
                        </div>
                    ) : (
                        <div className="text-sm text-green-600 bg-green-50 rounded-md p-3">
                            Email verified — redirecting...
                        </div>
                    )}

                    <p className="text-sm text-gray-500">
                        Didn't receive the email? Check your spam folder or enter your email to resend:
                    </p>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-md p-3">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm text-green-600 bg-green-50 rounded-md p-3">
                            Verification email has been resent successfully.
                        </div>
                    )}

                    <div className="mt-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                        />
                    </div>

                    <button
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={resendVerificationEmail}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Click here to resend'}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Link
                        href="/auth/login"
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                        Return to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
