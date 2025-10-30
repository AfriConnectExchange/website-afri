"use client";

import * as React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { buildJsonAdminHeaders } from '@/lib/admin-client';

export type CategoryFormValues = {
  name: string;
  type: 'PRODUCT' | 'COURSE' | 'TICKET' | string;
  parent_id?: string | null;
  description?: string | null;
  is_active?: boolean;
};

export default function CategoryForm({
  initial,
  onSuccess,
  mode = 'create',
}: {
  initial?: Partial<CategoryFormValues>;
  onSuccess?: (data?: any) => void;
  mode?: 'create' | 'edit';
}) {
  const [values, setValues] = React.useState<CategoryFormValues>({
    name: initial?.name ?? '',
    type: (initial?.type as any) ?? 'PRODUCT',
    parent_id: initial?.parent_id ?? null,
    description: initial?.description ?? null,
    is_active: initial?.is_active ?? true,
  });

  const [saving, setSaving] = React.useState(false);
  const [parents, setParents] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    // fetch parent categories for select options
    let mounted = true;
    (async () => {
      try {
        const headers = await buildJsonAdminHeaders();
        const res = await fetch('/api/admin/categories', { headers });
        const json = await res.json();
        if (json?.ok && mounted) {
          const list = (json.data || []).map((c: any) => ({ id: c.id, name: c.name }));
          setParents(list);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setField = (k: keyof CategoryFormValues, v: any) => setValues((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await buildJsonAdminHeaders();
      if (mode === 'create') {
        const res = await fetch('/api/admin/categories', { method: 'POST', headers, body: JSON.stringify(values) });
        const json = await res.json();
        if (json?.ok) onSuccess?.(json);
        else throw new Error(json?.error || 'Create failed');
      } else {
        // edit mode: expects initial.id
        const id = (initial as any)?.id;
        if (!id) throw new Error('Missing category id');
        const res = await fetch(`/api/admin/categories/${id}`, { method: 'PATCH', headers, body: JSON.stringify(values) });
        const json = await res.json();
        if (json?.ok) onSuccess?.(json);
        else throw new Error(json?.error || 'Update failed');
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <TextField label="Name" value={values.name} onChange={(e) => setField('name', e.target.value)} required />

        <TextField select label="Type" value={values.type} onChange={(e) => setField('type', e.target.value)}>
          <MenuItem value="PRODUCT">Product</MenuItem>
          <MenuItem value="COURSE">Course</MenuItem>
          <MenuItem value="TICKET">Ticket</MenuItem>
        </TextField>

        <TextField select label="Parent" value={values.parent_id ?? ''} onChange={(e) => setField('parent_id', e.target.value || null)}>
          <MenuItem value="">— None —</MenuItem>
          {parents.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </TextField>

        <TextField label="Description" value={values.description ?? ''} onChange={(e) => setField('description', e.target.value)} multiline rows={3} />

        <FormControlLabel control={<Checkbox checked={!!values.is_active} onChange={(e) => setField('is_active', e.target.checked)} />} label="Active" />

        <Box>
          <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
