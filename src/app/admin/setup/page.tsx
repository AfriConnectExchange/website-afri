"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AdminSetupPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin-auth/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json?.ok) {
        toast({ title: 'Created', description: 'Admin account created. You can now login.' });
        try { router.push('/admin/login'); } catch (e) {}
      } else {
        toast({ title: 'Failed', description: json?.error || 'Could not create admin.' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="container mx-auto px-4 py-8 max-w-md">
      <Typography variant="h6" sx={{ mb: 2 }}>Create admin account</Typography>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth required />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required />
          <Button type="submit" variant="contained" disabled={loading}>Create admin</Button>
        </Stack>
      </form>
    </Box>
  );
}
