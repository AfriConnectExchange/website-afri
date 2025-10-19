
'use client';

import { Header } from '@/components/dashboard/header';
import { NotificationsPage } from '@/components/notifications/notifications-page';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loader';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export default function Notifications() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [router, isLoading, isAuthenticated]);

  if (isLoading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1">
        <NotificationsPage onNavigate={router.push} />
      </main>
    </div>
  );
}
