"use client";
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);

  const fetchDevices = async () => {
    const res = await fetch('/api/auth/list-devices');
    const json = await res.json();
    setDevices(json.devices || []);
  };

  useEffect(() => { fetchDevices(); }, []);

  const revoke = async (deviceId: string) => {
    await fetch('/api/auth/revoke-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: deviceId }) });
    fetchDevices();
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Devices</h1>
      <div className="space-y-3">
        {devices.map(d => (
          <div key={d.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{d.device_name || d.device_id}</div>
              <div className="text-sm text-muted-foreground">{d.browser_name} • {d.os_name} • {new Date(d.last_seen_at).toLocaleString()}</div>
            </div>
            <div>
              <Button variant="destructive" onClick={() => revoke(d.device_id)}>Revoke</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
