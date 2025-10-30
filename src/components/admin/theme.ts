import { createTheme } from '@mui/material/styles';

// Deep indigo accent used across the admin UI
const ADMIN_PRIMARY = '#2C2A4A';

const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: ADMIN_PRIMARY },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#0f172a' },
  },
  shape: { borderRadius: 8 },
  typography: {
    button: { textTransform: 'none', fontWeight: 600 },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.85rem' },
    h6: { fontSize: '1rem', fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      defaultProps: { color: 'default', elevation: 1 },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiToolbar: {
      defaultProps: { variant: 'dense' },
    },
    MuiButton: {
      defaultProps: { size: 'small' },
    },
    MuiIconButton: {
      defaultProps: { size: 'small' },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: 6,
          paddingBottom: 6,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
        },
      },
    },
    MuiBadge: {
      defaultProps: { overlap: 'circular' },
    },
  },
});

export default adminTheme;
