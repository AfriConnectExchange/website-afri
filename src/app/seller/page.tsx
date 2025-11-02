'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loader';

export default function SellerPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/seller/products');
  }, [router]);

  return <PageLoader />;
}
