
'use client';

import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { PageLoader } from '@/components/ui/loader';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, User as UserIcon, Shield, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader />;
  }
  
  const canAccess = user?.roles?.includes('admin');
  
  const navItems = [
    { id: 'user-management', label: 'User Management', href: '#', icon: UserIcon },
    { id: 'content-moderation', label: 'Content Moderation', href: '#', icon: Shield },
    { id: 'analytics', label: 'Platform Analytics', href: '#', icon: BarChart2 },
  ];

  if (!canAccess) {
    return (
        <div className="min-h-screen bg-muted/40">
            <DashboardHeader title="Access Denied" navItems={[]} />
            <main className="flex flex-1 items-center justify-center p-4 md:p-8">
                 <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <CardTitle>Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            You do not have permission to access the admin dashboard.
                        </p>
                         <Button className="w-full" onClick={() => router.push('/')}>
                            Go to Marketplace
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-muted/40">
      <DashboardHeader title="Admin Dashboard" navItems={navItems} />
      <main className="flex-1 p-4 md:gap-8 md:p-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
