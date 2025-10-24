"use client";

import React, { useState } from "react";

export default function LogsTestingPage() {
  const [eventType, setEventType] = useState("page_view");
  const [payload, setPayload] = useState<string>(JSON.stringify({ page: "/dev/logs-testing" }, null, 2));
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function sendLog() {
    setLoading(true);
    try {
      const parsed = JSON.parse(payload || "null");
      const res = await fetch("/api/logs/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: eventType, payload: parsed }),
      });
      const data = await res.json().catch(() => null);
      setResult({ status: res.status, body: data });
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function registerDevice() {
    setLoading(true);
    try {
      const device_id = typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2);
      const info = { ua: typeof navigator !== "undefined" ? navigator.userAgent : "unknown", ts: new Date().toISOString() };
      const res = await fetch("/api/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id, info }),
      });
      const data = await res.json().catch(() => null);
      setResult({ status: res.status, body: data });
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function verifySession() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-session");
      const data = await res.json().catch(() => null);
      setResult({ status: res.status, body: data });
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Logs & Devices Testing</h1>

      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Event type</label>
          <input
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payload (JSON)</label>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="w-full border rounded p-2 h-36 font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={sendLog} disabled={loading} className="bg-green-600 text-white rounded px-4 py-2">
            Send Log
          </button>
          <button onClick={registerDevice} disabled={loading} className="bg-blue-600 text-white rounded px-4 py-2">
            Register Device
          </button>
          <button onClick={verifySession} disabled={loading} className="bg-gray-700 text-white rounded px-4 py-2">
            Verify Session
          </button>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Result</h2>
          <pre className="bg-black text-white p-3 rounded overflow-auto max-h-80">{result ? JSON.stringify(result, null, 2) : "No result yet"}</pre>
        </div>
      </div>
    </div>
  );
}
