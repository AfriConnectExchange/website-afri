

"use client";

import { useState } from 'react';
import SignInCard from '@/components/auth/SignInCard';
import SignUpCard from '@/components/auth/SignUpCard';

type AuthStep = 'signin' | 'signup';

export default function AuthPage() {
  const [authStep, setAuthStep] = useState<AuthStep>('signin');
 
  const renderAuthStep = () => {
    switch(authStep) {
      case 'signin':
        return <SignInCard />;
      case 'signup':
        return <SignUpCard />;
      default:
        return <SignInCard />;
    }
  }

  // This page is now a simple container and does not need to manage OTP state.
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
            {renderAuthStep()}
        </div>
    </div>
  );
}
