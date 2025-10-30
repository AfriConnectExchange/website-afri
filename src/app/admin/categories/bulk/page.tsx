"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { buildJsonAdminHeaders } from '@/lib/admin-client';

export default function CategoriesBulkUploadPage() {
  const [text, setText] = React.useState('');
  const [preview, setPreview] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any | null>(null);
  const [autoCreateParents, setAutoCreateParents] = React.useState(false);

  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ''));
      try {
        const parsed = JSON.parse(String(reader.result ?? ''));
        setPreview(Array.isArray(parsed) ? parsed.slice(0, 50) : []);
      } catch (e) {
        setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  React.useEffect(() => {
    try {
      const parsed = JSON.parse(text || '[]');
      setPreview(Array.isArray(parsed) ? parsed.slice(0, 50) : []);
    } catch (e) {
      setPreview([]);
    }
  }, [text]);

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const headers = await buildJsonAdminHeaders();
      // Wrap into { items, options } for our enhanced endpoint, keep compatibility if text is array
      let payload: any;
      try {
        const parsed = JSON.parse(text || '[]');
        if (Array.isArray(parsed)) payload = { items: parsed, options: { auto_create_parents: autoCreateParents } };
        else payload = parsed;
      } catch (e) {
        // if parse fails, send as-is and let server validate
        payload = text;
      }

      const res = await fetch('/api/admin/categories/bulk', { method: 'POST', headers, body: JSON.stringify(payload) });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Bulk upload categories (JSON)</Typography>

      <Stack spacing={2}>
        <TextField multiline minRows={10} label="Paste JSON array here" value={text} onChange={(e) => setText(e.target.value)} />

        <input type="file" accept="application/json" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />

        <Box>
          <FormControlLabel
            control={<Checkbox checked={autoCreateParents} onChange={(e) => setAutoCreateParents(e.target.checked)} />}
            label="Auto-create parents when parent_name provided"
          />
          <Button variant="contained" onClick={submit} disabled={loading || !text} sx={{ mt: 1 }}>Upload</Button>
        </Box>

        <Typography variant="subtitle2">Preview (first 50 items)</Typography>
        <pre style={{ maxHeight: 240, overflow: 'auto', background: '#f9fafb', padding: 12 }}>{JSON.stringify(preview, null, 2)}</pre>

        {result && (
          <Box>
            <Typography variant="subtitle2">Result</Typography>
            {!result.ok && (
              <Alert severity="error">
                <AlertTitle>Upload failed</AlertTitle>
                {String(result.error ?? 'Unknown error')}
              </Alert>
            )}

            {result.ok && (
              <>
                <Alert severity="success">
                  <AlertTitle>Upload complete</AlertTitle>
                  Created: {Array.isArray(result.created) ? result.created.length : 0} — Skipped: {Array.isArray(result.skipped) ? result.skipped.length : 0} — Errors: {Array.isArray(result.errors) ? result.errors.length : 0}
                </Alert>

                {Array.isArray(result.errors) && result.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="error">
                      <AlertTitle>Per-item errors</AlertTitle>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(result.errors, null, 2)}</pre>
                    </Alert>
                  </Box>
                )}

                {Array.isArray(result.created) && result.created.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info">
                      <AlertTitle>Created IDs</AlertTitle>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(result.created, null, 2)}</pre>
                    </Alert>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
