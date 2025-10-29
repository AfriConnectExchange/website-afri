
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerLayout() {
  // Redirect legacy /(seller) group to /(vendor) or /vendor
  const router = useRouter();
  useEffect(() => {
    router.replace('/vendor');
  }, [router]);
  return null;
}
