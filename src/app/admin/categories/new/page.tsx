"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CategoryForm from '@/components/admin/CategoryForm';
import { useRouter } from 'next/navigation';

export default function NewCategoryPage() {
  const router = useRouter();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Create category</Typography>
      <CategoryForm
        mode="create"
        onSuccess={(json) => {
          // navigate back to list
          try { router.push('/admin/categories'); } catch (e) {}
        }}
      />
    </Box>
  );
}
