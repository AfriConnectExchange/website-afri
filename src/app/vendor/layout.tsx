 'use client';
 import { PageLoader } from '@/components/ui/loader';
 import { useRouter, usePathname } from 'next/navigation';
 import { useEffect } from 'react';
 import { SellerSidebar } from '@/components/vendor/seller-sidebar';
 import { useAuth } from '@/context/auth-context';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/vendor';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isAuthPage) {
        router.push('/vendor');
      } else if (isAuthenticated && isAuthPage) {
        router.push('/vendor/dashboard');
    } else if (isAuthenticated && !(user?.roles ?? []).includes('seller')) {
        // Optional: Redirect if user is not a seller
        // router.push('/'); 
      }
    }
  }, [user, isLoading, isAuthenticated, router, isAuthPage, pathname]);

  if (isLoading && !isAuthPage) {
    return <PageLoader />;
  }

  if (!isAuthenticated && !isAuthPage) {
    return <PageLoader />;
  }

  // For the login page, we don't want the sidebar
  if (isAuthPage || !isAuthenticated) {
    return <main className="bg-gray-100">{children}</main>;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SellerSidebar />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
