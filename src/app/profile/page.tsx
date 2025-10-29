
'use client';
import { Header } from '@/components/dashboard/header';
import { ProfilePage } from '@/components/profile/profile-page';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loader';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export default function UserProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-7xl items-start gap-6">
          <ProfilePage />
        </div>
      </main>
    </div>
  );
}
