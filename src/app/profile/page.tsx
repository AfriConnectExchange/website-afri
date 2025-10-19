'use client';
import { Header } from '@/components/dashboard/header';
import { ProfilePage } from '@/components/profile/profile-page';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loader';
import { useEffect, useState } from 'react';


export default function UserProfilePage() {
  // TODO: Add authentication logic or remove this comment if not needed

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
          <ProfilePage />
        </div>
      </main>
    </div>
  );
}
