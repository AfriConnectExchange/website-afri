"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/lib/context/GlobalContext';

export default function ReactivatePage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showSnackbar } = useGlobal();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/account/reactivation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });
      const json = await res.json();
      if (res.ok) {
        showSnackbar({ title: 'Request submitted', description: 'We will review your request and reply by email.' }, 'success');
        router.push('/');
      } else {
        showSnackbar({ title: 'Error', description: json?.error || 'Failed to submit request' }, 'error');
      }
    } catch (err: any) {
      showSnackbar({ title: 'Error', description: err?.message || 'Network error' }, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Request Account Reactivation</h1>
      <p className="mb-4">If your account was suspended or disabled and you believe this was a mistake, submit a request and our team will review it.</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Message (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Sending...' : 'Submit request'}</button>
        </div>
      </form>
    </div>
  );
}
