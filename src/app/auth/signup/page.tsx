"use client";

import SignUpCard from '@/components/auth/SignUpCard';

export default function SignUpPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-xl">
             <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-base sm:text-lg">AE</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-bold">AfriConnect Exchange</span>
                </div>
                <h1 className="text-xl font-semibold mb-2">Create an Account</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Join our community to start buying and selling.
                </p>
            </div>
            <SignUpCard />
        </div>
    </div>
  );
}
