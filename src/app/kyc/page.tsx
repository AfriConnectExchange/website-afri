
'use client';
import { KycFlow } from '@/components/kyc/kyc-flow';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { PageLoader } from '@/components/ui/loader';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createSPAClient } from '@/lib/supabase/client';

export default function KycPage() {
  const supabase = createSPAClient();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsUserLoading(false);
      if (!session?.user) {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);


  if (isUserLoading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 md:gap-8 md:p-8">
        <KycFlow onNavigate={router.push} />
      </main>
    </div>
  );
}
