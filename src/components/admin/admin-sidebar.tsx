"use client";

import React from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Home, Users, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";

export default function AdminSidebar() {
  const router = useRouter();
  const { logout, user } = useAdminAuth();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="offcanvas">
        <div className="flex h-full flex-col">
          <SidebarHeader className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span className="font-medium">Admin</span>
            </div>
            <div>
              <SidebarTrigger />
            </div>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent className="px-2 py-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin/secured" className="block">
                  <SidebarMenuButton asChild>
                    <a className="flex items-center gap-2"><Users className="h-4 w-4" /> <span>Dashboard</span></a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="#" className="block">
                  <SidebarMenuButton asChild>
                    <a className="flex items-center gap-2"><Settings className="h-4 w-4" /> <span>Settings</span></a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <div className="mt-auto p-3">
            <SidebarFooter>
              <div className="px-1">
                <div className="text-xs text-muted-foreground mb-2">Signed in as</div>
                <div className="mb-2 font-medium">{user?.username ?? 'admin'}</div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </Button>
              </div>
            </SidebarFooter>
          </div>
        </div>
      </Sidebar>
    </SidebarProvider>
  );
}
