"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface KycItem {
  id: string;
  user_id: string;
  id_type: string;
  id_number: string;
  id_front_url: string;
  id_back_url?: string;
  proof_of_address_url?: string;
  submitted_at?: any;
}

export default function AdminKycPage() {
  const [items, setItems] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const { toast } = useToast();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/kyc/pending');
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      toast({ title: 'Failed to load KYC submissions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const review = async (userId: string, decision: 'approved' | 'rejected', reason?: string) => {
    setActioning(userId);
    try {
      const res = await fetchWithAuth('/api/admin/kyc/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, decision, reason })
      });
      if (!res.ok) throw new Error('Request failed');
      toast({ title: decision === 'approved' ? 'KYC approved' : 'KYC rejected' });
      await load();
      setDetailOpen(false);
      setRejectOpen(false);
      setRejectReason('');
    } catch (e) {
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setActioning(null);
    }
  };

  const openDetail = async (userId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/kyc/${userId}`);
      const data = await res.json();
      setDetail(data);
    } catch (e) {
      toast({ title: 'Failed to load details', variant: 'destructive' });
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-4">KYC Review</h1>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Pending Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-slate-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-slate-400">No pending submissions.</div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="p-4 bg-slate-700 rounded flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-slate-200 text-sm">
                    <div><span className="text-slate-400">User:</span> {item.user_id}</div>
                    <div><span className="text-slate-400">ID Type:</span> {item.id_type}</div>
                    <div className="flex gap-3 mt-2">
                      <a href={item.id_front_url} target="_blank" className="underline text-blue-300">View ID</a>
                      {item.id_back_url && <a href={item.id_back_url} target="_blank" className="underline text-blue-300">Back</a>}
                      {item.proof_of_address_url && <a href={item.proof_of_address_url} target="_blank" className="underline text-blue-300">Proof of Address</a>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <Button size="sm" variant="secondary" onClick={() => openDetail(item.user_id)}>Review</Button>
                    <Button size="sm" disabled={actioning === item.user_id} onClick={() => review(item.user_id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="destructive" disabled={actioning === item.user_id} onClick={() => { setRejectOpen(true); setDetail({ submission: item, user: null }); setRejectReason(''); setActioning(null); }}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer/Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>KYC Submission Detail</DialogTitle>
            <DialogDescription>Full user snapshot and submitted documents</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">User</h4>
                  <div className="text-sm text-muted-foreground">Name: <span className="text-foreground">{detail.user?.display_name || '—'}</span></div>
                  <div className="text-sm text-muted-foreground">Email: <span className="text-foreground">{detail.user?.email || '—'}</span></div>
                  <div className="text-sm text-muted-foreground">Roles: <span className="text-foreground">{(detail.user?.roles || []).join(', ') || '—'}</span></div>
                  <div className="text-sm text-muted-foreground">Status: <span className="text-foreground">{detail.user?.verification_status || 'unverified'}</span></div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Submission</h4>
                  <div className="text-sm text-muted-foreground">ID Type: <span className="text-foreground">{detail.submission?.id_type}</span></div>
                  <div className="text-sm text-muted-foreground">ID Number: <span className="text-foreground">{detail.submission?.masked_id_number || '—'}</span></div>
                  <div className="text-sm text-muted-foreground">Nationality: <span className="text-foreground">{detail.submission?.nationality || '—'}</span></div>
                  <div className="text-sm text-muted-foreground">Phone: <span className="text-foreground">{detail.submission?.primary_phone || '—'}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detail.submission?.id_front_url && (
                  <div>
                    <div className="text-sm font-medium mb-1">Identity Document</div>
                    <img src={detail.submission.id_front_url} alt="ID document" className="rounded border" />
                  </div>
                )}
                {detail.submission?.proof_of_address_url && (
                  <div>
                    <div className="text-sm font-medium mb-1">Proof of Address</div>
                    <img src={detail.submission.proof_of_address_url} alt="Proof of address" className="rounded border" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>
                <Button onClick={() => review(detail.submission.user_id, 'approved')} disabled={actioning === detail?.submission?.user_id}>Approve</Button>
                <Button variant="destructive" onClick={() => { setRejectOpen(true); setRejectReason(''); }}>Reject</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject KYC Submission</DialogTitle>
            <DialogDescription>Please provide a short reason to help the user fix the issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g., Document is blurry, name mismatch, address doc older than 3 months, etc." />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim() || !detail?.submission?.user_id || actioning === detail?.submission?.user_id} onClick={() => review(detail.submission.user_id, 'rejected', rejectReason.trim())}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
