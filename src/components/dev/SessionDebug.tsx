"use client";

import React, { useEffect, useState } from 'react';
import { useSession, getSession } from 'next-auth/react';

export default function SessionDebug() {
  const { data: session, status } = useSession();
  const [cookie, setCookie] = useState<string>('');
  const [apiSession, setApiSession] = useState<any>(null);

  useEffect(() => {
    try {
      setCookie(typeof document !== 'undefined' ? document.cookie : '');
    } catch (err) {
      setCookie('unavailable');
    }

    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const json = await res.json();
        if (mounted) setApiSession(json);
      } catch (err) {
        if (mounted) setApiSession({ error: (err as any).message });
      }
    })();

    return () => { mounted = false; };
  }, [status]);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 9999, background: 'rgba(0,0,0,0.7)', color: 'white', padding: 12, borderRadius: 8, fontSize: 12, maxWidth: 420 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Dev Session Debug</div>
      <div><strong>useSession status:</strong> {status}</div>
      <div style={{ marginTop: 6 }}><strong>session (useSession):</strong> <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(session, null, 2)}</pre></div>
      <div style={{ marginTop: 6 }}><strong>document.cookie:</strong> <div style={{ wordBreak: 'break-all' }}>{cookie || '(empty)'}</div></div>
      <div style={{ marginTop: 6 }}><strong>GET /api/auth/session:</strong> <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(apiSession, null, 2)}</pre></div>
    </div>
  );
}
