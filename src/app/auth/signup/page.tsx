"use client";

import SignUpCard from '@/components/auth/SignUpCard';

export default function SignUpPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px] p-4 lg:p-8">
        <SignUpCard />
      </div>
    </div>
  );
}
