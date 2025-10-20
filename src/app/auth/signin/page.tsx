"use client";

import SignInCard from '@/components/auth/SignInCard';

export default function SignInPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-xl">
            <SignInCard />
        </div>
    </div>
  );
}
