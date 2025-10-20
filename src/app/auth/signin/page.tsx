
"use client";

import SignInCard from '@/components/auth/SignInCard';

export default function SignInPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
             <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-base sm:text-lg">AE</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-bold">AfriConnect Exchange</span>
                </div>
                <h1 className="text-xl font-semibold mb-2">Welcome Back!</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sign in to continue your journey
                </p>
            </div>
            <SignInCard />
        </div>
    </div>
  );
}
