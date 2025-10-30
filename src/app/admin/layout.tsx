"use client";

import * as React from 'react';
import AdminDrawer, { DRAWER_WIDTH, navItems } from '@/components/admin/AdminDrawer';
import AdminAppBar from '@/components/admin/AdminAppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import adminTheme from '@/components/admin/theme';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AdminAuthProvider } from '@/context/admin-auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isDesktop = useMediaQuery(adminTheme.breakpoints.up('sm'));
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/admin';

  // Redirect to admin login if user is neither a firebase-admin nor has an admin session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const adminSessionRaw = sessionStorage.getItem('__afri_admin_session');
    const hasAdminSession = !!adminSessionRaw;

    if (!isLoading) {
      const roles = user?.roles || [];
      const hasFirebaseAdmin = roles.includes('admin') || roles.includes('superadmin');

      if (!hasFirebaseAdmin && !hasAdminSession) {
        try { router.push('/admin/login'); } catch (e) {}
      }
    }
  }, [isLoading, user, router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // determine active title from navItems using longest matching href
  const matches = navItems.filter((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
  matches.sort((a, b) => b.href.length - a.href.length);
  const active = matches[0] ?? null;

  return (
    <AdminAuthProvider>
      <ThemeProvider theme={adminTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
  <AdminDrawer mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

  {/* Top AppBar (fixed) */}
  <AdminAppBar title={active?.title ?? 'Admin'} handleDrawerToggle={handleDrawerToggle} />

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
          {/* Toolbar spacer to offset fixed AppBar */}
          <Toolbar />

          <div className="container mx-auto px-2 py-4">{children}</div>
        </Box>
        </Box>
      </ThemeProvider>
    </AdminAuthProvider>
  );
}
