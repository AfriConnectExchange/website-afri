"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, address, city, country, postcode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data?.message || 'Failed to update profile');
        setLoading(false);
        return;
      }

      // Success: navigate to home or previous page
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-4">Complete your profile</h1>
        <p className="mb-4">We need a few details before you can access the marketplace.</p>

        <form onSubmit={handleSubmit} className="space-y-3 bg-card p-6 rounded-lg">
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full mt-1 p-2 border rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full mt-1 p-2 border rounded" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Postcode</label>
            <input value={postcode} onChange={(e) => setPostcode(e.target.value)} className="w-full mt-1 p-2 border rounded" />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded">
              {loading ? 'Saving...' : 'Save and Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
