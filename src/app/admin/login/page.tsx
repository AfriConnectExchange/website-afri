"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAdminAuth } from '@/context/admin-auth-context';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login } = useAdminAuth();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await login(username, password);
      if (ok) {
        try { router.push('/admin'); } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="container mx-auto px-4 py-8 max-w-md">
      <Typography variant="h6" sx={{ mb: 2 }}>Admin login</Typography>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth required />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required />
          <Button type="submit" variant="contained" disabled={loading}>Sign in</Button>
        </Stack>
      </form>
    </Box>
  );
}
