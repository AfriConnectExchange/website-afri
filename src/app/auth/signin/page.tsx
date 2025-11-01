
"use client";

import SignInCard from '@/components/auth/SignInCard';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const params = useSearchParams();
  const sessionExpired = params?.get('session_expired');

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
             <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-base sm:text-lg">AE</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-bold">AfriConnect Exchange</span>
                </div>
                <h1 className="text-xl font-semibold mb-2">Welcome Back!</h1>
                {sessionExpired ? (
                  <p className="text-sm text-destructive font-medium">Your session has expired. Please sign in again to continue.</p>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">Sign in to continue your journey. Use <strong>test@example.com</strong> and <strong>password</strong> to sign in.</p>
                )}
            </div>
            <Card>
                <CardContent className="p-6">
                    <SignInCard />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
