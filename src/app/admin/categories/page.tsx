"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Link from 'next/link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { auth as clientAuth } from '@/lib/firebaseClient';
import { useAuth } from '@/context/auth-context';

type Category = {
  id: string;
  name: string;
  type: string;
  parent_id?: string | null;
  description?: string | null;
  is_active?: boolean;
};

export default function AdminCategoriesPage() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<Category[]>([]);
  const { user } = useAuth();

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = await clientAuth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/categories', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      if (json?.ok) setItems(json.data || []);
    } catch (err) {
      console.warn('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onDelete = React.useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to disable this category?')) return;
    try {
      const token = await clientAuth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      if (json?.ok) fetchList();
      else alert(json?.error || 'Failed');
    } catch (err) {
      console.warn('delete failed', err);
    }
  }, [fetchList]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Categories</Typography>
        <Button component={Link} href="/admin/categories/new" variant="contained" color="primary" size="small">
          Add category
        </Button>
      </Stack>

      <Box>
        {loading ? (
          <Stack spacing={1}>
            {[1, 2, 3, 4].map((i) => (
              <Stack key={i} direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
                <Skeleton variant="rectangular" width={48} height={32} />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="20%" />
              </Stack>
            ))}
          </Stack>
        ) : items.length === 0 ? (
          <Typography variant="body1">No categories yet — this page will list and manage categories.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.parent_id ?? '-'}</TableCell>
                  <TableCell>{c.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" component={Link} href={`/admin/categories/${c.id}`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(c.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  );
}
