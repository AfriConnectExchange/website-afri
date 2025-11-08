
import React, { Suspense } from 'react';
import SignInClient from '@/components/auth/SignInClient';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <SignInClient />
    </Suspense>
  );
}
