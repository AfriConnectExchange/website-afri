'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { listSessions, revokeSession } from '@/lib/session-client';
import { useGlobal } from '@/lib/context/GlobalContext';

export function SessionsList() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useGlobal();

  const load = async () => {
    setLoading(true);
    try {
      const items = await listSessions();
      setSessions(items);
    } catch (e) {
      console.error('Failed to load sessions', e);
      showSnackbar({ title: 'Error', description: 'Could not load sessions.' }, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (id: string) => {
    try {
      await revokeSession(id);
      showSnackbar({ title: 'Session revoked', description: 'The session has been revoked.' }, 'success');
      load();
    } catch (e) {
      console.error('Failed to revoke', e);
      showSnackbar({ title: 'Error', description: 'Could not revoke session.' }, 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border rounded p-4">
      <h3 className="text-lg font-medium mb-3">Active Sessions</h3>
      {loading && <div>Loading sessions...</div>}
      {!loading && sessions.length === 0 && <div className="text-sm text-muted-foreground">No sessions found.</div>}
      <ul className="space-y-3">
        {sessions.map(s => (
          <li key={s.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{s.user_agent ?? 'Unknown device'}</div>
              <div className="text-sm text-muted-foreground">{s.ip_address ?? 'Unknown IP'} • {new Date(s.last_seen_at ?? s.created_at).toLocaleString()}</div>
            </div>
            <div>
              <Button variant="ghost" size="sm" onClick={() => handleRevoke(s.id)}>Revoke</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
