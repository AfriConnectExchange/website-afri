"use client";

import SignUpCard from '@/components/auth/SignUpCard';

export default function SignUpPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
  <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:max-w-xl p-4 lg:p-8">
        <SignUpCard />
      </div>
    </div>
  );
}
