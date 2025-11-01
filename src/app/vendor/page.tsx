'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loader';

export default function VendorPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to vendor dashboard
        router.push('/vendor/dashboard');
    }, [router]);

    return <PageLoader />;
}
