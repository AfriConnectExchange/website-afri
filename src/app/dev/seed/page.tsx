"use client";
import { useEffect, useRef, useState } from 'react';

export default function DevSeedPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, []);

  function startStream() {
    setLogs([]);
    setRunning(true);
    const es = new EventSource('/api/dev/seed/stream');
    esRef.current = es;
    es.onmessage = (ev) => {
      setLogs((prev) => [...prev, ev.data]);
      if (ev.data && ev.data.includes('done')) {
        setRunning(false);
        es.close();
      }
    };
    es.onerror = (err) => {
      setLogs((prev) => [...prev, 'EventSource error']);
      setRunning(false);
      es.close();
    };
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dev Seeder</h1>
      <p className="mb-4">This page streams seeding logs while inserting mock data into the DB. Use only in dev.</p>
      <div className="mb-4">
        <button
          onClick={startStream}
          className={`px-4 py-2 rounded ${running ? 'bg-gray-400' : 'bg-primary'}`}
          disabled={running}
        >
          {running ? 'Seeding...' : 'Start Seeding'}
        </button>
      </div>

      <div className="bg-black text-white p-4 rounded h-64 overflow-auto">
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No logs yet. Click Start Seeding.</div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="text-sm font-mono whitespace-pre-wrap">{l}</div>
          ))
        )}
      </div>
    </div>
  );
}
