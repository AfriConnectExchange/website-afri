import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export interface SnackbarMessage {
  title?: string;
  description?: string;
  code?: string; // optional error code (e.g. firebase auth code)
}

export interface SnackbarProps {
  open: boolean;
  message: string | SnackbarMessage;
  severity?: 'success' | 'error' | 'info' | 'warning';
  autoHideDuration?: number;
  onClose: () => void;
  anchorOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'center' | 'right' };
}

// Minimal translation map for common Firebase auth errors.
const AUTH_ERROR_TRANSLATIONS: Record<string, { title: string; description: string }> = {
  'auth/user-not-found': { title: 'Account not found', description: 'No account exists with the provided credentials.' },
  'auth/wrong-password': { title: 'Invalid credentials', description: 'Email or password is incorrect.' },
  'auth/invalid-email': { title: 'Invalid email', description: 'Please enter a valid email address.' },
  'auth/network-request-failed': { title: 'Network error', description: 'Please check your connection and try again.' },
  'auth/popup-closed-by-user': { title: 'Sign-in Cancelled', description: 'The sign-in popup was closed before completing.' },
  // add more mappings as needed
};

function translateMessage(raw: string | SnackbarMessage): { title?: string; description: string } {
  if (typeof raw === 'string') {
    // Try to detect a firebase auth code inside the string
    const match = raw.match(/auth\/[\w-]+/);
    if (match) {
      const code = match[0];
      const mapped = AUTH_ERROR_TRANSLATIONS[code];
      if (mapped) return mapped;
    }
    // fallback: render the whole string as description
    return { description: raw };
  }

  // If object provided, prefer explicit code/title/description
  if (raw.code) {
    const mapped = AUTH_ERROR_TRANSLATIONS[raw.code];
    if (mapped) return mapped;
  }

  if (raw.title || raw.description) {
    return { title: raw.title, description: raw.description ?? '' };
  }

  return { description: '' };
}

export default function MuiSnackbar({ open, message, severity = 'info', autoHideDuration = 5000, onClose, anchorOrigin = { vertical: 'top', horizontal: 'right' } }: SnackbarProps) {
  const { title, description } = translateMessage(message);

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
        aria-live="polite"
      >
        {title ? (
          <div>
            <strong>{title}</strong>
            {description ? <div>{description}</div> : null}
          </div>
        ) : (
          <div>{description}</div>
        )}
      </Alert>
    </Snackbar>
  );
}
