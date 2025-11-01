"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { adminUser, isAdminLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check on login and create-account pages
    if (pathname === "/admin/login" || pathname === "/admin/create-account") {
      return;
    }

    // If not loading and no admin user, redirect to login
    if (!isAdminLoading && !adminUser) {
      router.push("/admin/login");
    }
  }, [adminUser, isAdminLoading, router, pathname]);

  // Show loading state
  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  // Public pages (login, create account)
  if (pathname === "/admin/login" || pathname === "/admin/create-account") {
    return <>{children}</>;
  }

  // Protected admin pages - require authentication
  if (!adminUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen bg-slate-900">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
