"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export const DRAWER_WIDTH = 240;

interface AdminDrawerProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  container?: () => Window;
}

const navItems = [
  { title: 'Dashboard', href: '/admin', icon: <DashboardIcon /> },
  { title: 'Users', href: '/admin/users', icon: <PeopleIcon /> },
  { title: 'Products', href: '/admin/products', icon: <InventoryIcon /> },
  { title: 'Orders', href: '/admin/orders', icon: <ShoppingCartIcon /> },
  { title: 'Settings', href: '/admin/settings', icon: <SettingsIcon /> },
];

export default function AdminDrawer({ mobileOpen, handleDrawerToggle, container }: AdminDrawerProps) {
  const pathname = usePathname() || '/admin';
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const ACCENT = '#2C2A4A';

  const drawer = (
    <div>
      {/* dense toolbar for compact header */}
      <Toolbar variant="dense" sx={{ px: 1.5 }}>
        <Typography variant="subtitle1" noWrap component="div" sx={{ color: ACCENT, fontWeight: 600 }}>
          Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={pathname === item.href || pathname.startsWith(item.href + '/')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(44,42,74,0.08)',
                  color: ACCENT,
                  '& .MuiListItemIcon-root': { color: ACCENT },
                },
                '&:hover': { backgroundColor: 'rgba(44,42,74,0.04)' },
                py: 0.5,
                px: 1.5,
                minHeight: 40,
              }}
            >
              <ListItemIcon sx={{ color: ACCENT, minWidth: 36, mr: 1 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/"
            onClick={() => {
              /* TODO: implement logout */
            }}
            sx={{ '&:hover': { backgroundColor: 'rgba(44,42,74,0.04)' }, py: 0.5, px: 1.5, minHeight: 40 }}
          >
            <ListItemIcon sx={{ color: '#6b7280', minWidth: 36 }}>
              <LogoutIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Back to site" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }} aria-label="admin navigation">
      {/* Temporary drawer for mobile */}
      <Drawer
        container={container}
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }} // Better performance on mobile
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: { xs: 200, sm: DRAWER_WIDTH },
            backgroundColor: '#ffffff',
            color: 'inherit',
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}
