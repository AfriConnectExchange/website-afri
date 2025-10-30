"use client";

import * as React from 'react';
import AdminDrawer, { DRAWER_WIDTH } from '@/components/admin/AdminDrawer';
import AdminAppBar from '@/components/admin/AdminAppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminDrawer mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Top AppBar (fixed) */}
      <AdminAppBar handleDrawerToggle={handleDrawerToggle} />

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        {/* Toolbar spacer to offset fixed AppBar */}
        <Toolbar />

        <div className="container mx-auto px-2 py-4">{children}</div>
      </Box>
    </Box>
  );
}
