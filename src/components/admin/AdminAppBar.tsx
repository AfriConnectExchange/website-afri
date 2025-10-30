"use client";

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DRAWER_WIDTH } from '@/components/admin/AdminDrawer';

interface AdminAppBarProps {
  title?: string;
  handleDrawerToggle?: () => void;
}

export default function AdminAppBar({ title = 'Admin', handleDrawerToggle }: AdminAppBarProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      color="default"
      sx={{
        backgroundColor: '#ffffff',
        color: '#2C2A4A', // deep indigo for text/icons
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        borderBottom: '1px solid #e6e6e9',
        width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { sm: `${DRAWER_WIDTH}px` },
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar variant="dense">
        {/* show menu button only on mobile where drawer is temporary */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          size="small"
          onClick={handleDrawerToggle}
          sx={{ mr: 1.5, display: { sm: 'none' } }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        <Typography variant="subtitle1" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" aria-label="notifications" size="small">
            <Badge
              badgeContent={4}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#2C2A4A',
                  color: '#fff',
                  fontSize: '0.65rem',
                  minWidth: 18,
                  height: 18,
                },
              }}
            >
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>

          <Tooltip title="Account settings">
            <IconButton onClick={handleOpenMenu} sx={{ p: 0 }} size="small">
              <Avatar alt="Admin" src="/images/avatar.png" sx={{ bgcolor: '#2C2A4A', width: 32, height: 32 }}>
                <AccountCircle sx={{ color: '#ffffff', fontSize: 18 }} />
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleCloseMenu}>Profile</MenuItem>
            <MenuItem onClick={handleCloseMenu}>Settings</MenuItem>
            <MenuItem onClick={handleCloseMenu}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
