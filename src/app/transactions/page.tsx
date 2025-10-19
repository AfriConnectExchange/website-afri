
'use client';

import { Header } from '@/components/dashboard/header';
import { TransactionHistoryPage } from '@/components/transactions/transaction-history-page';
import { PageLoader } from '@/components/ui/loader';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function TransactionsPage() {
  const supabase = createClient();
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
  },[router, supabase]);

  if (isUserLoading || !user) {
    return <PageLoader />;
  }
  
  return (
    <div className="min-h-screen bg-muted/40">
        <Header />
        <main className="flex-1 p-4 md:gap-8 md:p-8">
            <TransactionHistoryPage />
        </main>
    </div>
  )
}
