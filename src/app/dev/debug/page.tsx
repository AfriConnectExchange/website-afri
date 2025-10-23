"use client";
import { useEffect, useState, useRef } from 'react';

function DebugPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/categories/all/products')
      .then(r => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Debug fetch products error', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Poll activity logs every 3s and refresh products on demand
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/dev/logs');
        const json = await res.json();
        setLogs(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error('Failed to fetch activity logs', err);
      }
    };

    // initial
    fetchLogs();
    pollRef.current = window.setInterval(fetchLogs, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="p-6 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dev Debug — Products & Seeder Logs</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Products (raw JSON)</h2>
        {loading ? (
          <div>Loading products...</div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded max-h-96 overflow-auto text-xs">{JSON.stringify(products, null, 2)}</pre>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Activity Logs (latest)</h2>
          <button
            className="text-sm text-primary underline"
            onClick={async () => {
              setLoading(true);
              const res = await fetch('/api/categories/all/products');
              const json = await res.json();
              setProducts(Array.isArray(json) ? json : []);
              setLoading(false);
            }}
          >
            Refresh Products
          </button>
        </div>

        <div className="bg-white border p-4 rounded max-h-96 overflow-auto text-xs">
          {logs.length === 0 ? (
            <div className="text-sm text-gray-500">No recent activity logs.</div>
          ) : (
            logs.map((l: any) => (
              <div key={l.id} className="mb-2">
                <div className="text-[12px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
                <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(l, null, 2)}</pre>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return <DebugPage />;
}
