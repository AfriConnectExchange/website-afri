"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CategoryForm from '@/components/admin/CategoryForm';
import { useRouter, useParams } from 'next/navigation';
import { auth as clientAuth } from '@/lib/firebaseClient';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [loading, setLoading] = React.useState(true);
  const [initial, setInitial] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;
    if (!id) return;
    (async () => {
      try {
        const token = await clientAuth.currentUser?.getIdToken();
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/admin/categories/${id}`, { headers });
        const json = await res.json();
        if (json?.ok && mounted) setInitial(json.data);
      } catch (e) {
        console.warn('Failed to load category', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (!id) return <Typography>Missing category id</Typography>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Edit category</Typography>
      {loading ? <Typography>Loading…</Typography> : initial ? (
        <CategoryForm mode="edit" initial={initial} onSuccess={() => { try { router.push('/admin/categories'); } catch (e) {} }} />
      ) : (
        <Typography>Category not found.</Typography>
      )}
    </Box>
  );
}
