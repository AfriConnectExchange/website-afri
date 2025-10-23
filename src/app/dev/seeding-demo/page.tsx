"use client";

import React, { useState, useEffect } from 'react';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function SeedingDemoPage() {
  const [email, setEmail] = useState('demo@example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const seed = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dev/seed/demo', { method: 'POST', body: JSON.stringify({ email }) });
      const json = await res.json();
      if (res.ok) {
        setLastUserId(json.user_id);
        pollLogs();
        alert('Seeded: ' + json.email);
      } else {
        alert('Seed failed: ' + (json.error || 'unknown'));
      }
    } catch (e) {
      alert('Seed request failed: ' + e);
    } finally { setIsLoading(false); }
  };

  const remove = async () => {
    if (!lastUserId) return alert('No seeded user to delete');
    setIsLoading(true);
    try {
      const res = await fetch('/api/dev/seed/demo', { method: 'DELETE', body: JSON.stringify({ user_id: lastUserId }) });
      const json = await res.json();
      if (res.ok) {
        alert('Deleted demo user');
        setLastUserId(null);
      } else {
        alert('Delete failed: ' + (json.error || 'unknown'));
      }
    } catch (e) {
      alert('Delete request failed: ' + e);
    } finally { setIsLoading(false); }
  };

  const pollLogs = async () => {
    try {
      const res = await fetch('/api/dev/logs');
      const json = await res.json();
      // Normalize response to an array. Endpoint may return { error } on failure.
      const arr = Array.isArray(json) ? json : (json?.data ?? []);
      setLogs(arr || []);
    } catch (e) {
      console.error('Failed to fetch logs', e);
      setLogs([]);
    }
  };

  useEffect(() => {
    const id = setInterval(pollLogs, 3000);
    pollLogs();
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Seeding Demo</h1>
      <div className="mb-4">
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 mr-2" />
        <AnimatedButton onClick={seed} isLoading={isLoading}>Create Demo User</AnimatedButton>
        <AnimatedButton onClick={remove} className="ml-2" variant="destructive" isLoading={isLoading}>Remove Demo User</AnimatedButton>
      </div>

      <h2 className="text-xl font-semibold mt-6">Recent Logs</h2>
      <div className="mt-2 bg-white p-4 rounded shadow max-h-96 overflow-auto">
        {(!Array.isArray(logs) || logs.length === 0) && <div className="text-sm text-muted-foreground">No logs yet</div>}
        {Array.isArray(logs) && logs.map((l: any) => (
          <div key={l.id} className="border-b py-2">
            <div className="text-sm text-muted-foreground">{l.created_at}</div>
            <div><strong>{l.action}</strong> — {l.entity_type} {l.entity_id}</div>
            {l.changes && <pre className="text-xs mt-2">{JSON.stringify(l.changes, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}
