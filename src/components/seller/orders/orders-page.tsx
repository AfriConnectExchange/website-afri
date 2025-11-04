'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrderItemSummary {
  product_id: string;
  product_title: string;
  quantity: number;
  price: number;
}

interface SellerOrder {
  id: string;
  order_number?: string;
  status?: string;
  total_amount?: number;
  payment_method?: string;
  payment_status?: string;
  created_at?: { seconds: number; nanoseconds: number } | string | null;
  buyer_name?: string;
  tracking_number?: string;
  items?: OrderItemSummary[];
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Awaiting confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' },
];

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  shipped: 'default',
  delivered: 'default',
  completed: 'default',
  cancelled: 'destructive',
  disputed: 'destructive',
};

const STATUS_UPDATE_OPTIONS = ['confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'] as const;

const toDate = (input?: SellerOrder['created_at']): Date | null => {
  if (!input) return null;
  if (typeof input === 'string') return new Date(input);
  if (typeof input === 'object' && 'seconds' in input) {
    return new Date(input.seconds * 1000);
  }
  return null;
};

const formatDate = (input?: SellerOrder['created_at']) => {
  const date = toDate(input);
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value || 0);
};

export function SellerOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    order: SellerOrder | null;
    nextStatus: string;
    trackingNumber: string;
  }>({ open: false, order: null, nextStatus: 'confirmed', trackingNumber: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders(selectedStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const loadOrders = async (status: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const response = await fetchWithAuth(`/api/orders/seller${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Unable to load orders');
      toast({
        variant: 'destructive',
        title: 'Orders unavailable',
        description: err.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statusSummary = useMemo(() => {
    const summary = orders.reduce(
      (acc, order) => {
        const key = order.status || 'pending';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return summary;
  }, [orders]);

  const handleOpenDialog = (order: SellerOrder) => {
    setStatusDialog({
      open: true,
      order,
      nextStatus: order.status && STATUS_UPDATE_OPTIONS.includes(order.status as any)
        ? order.status
        : 'confirmed',
      trackingNumber: order.tracking_number || '',
    });
  };

  const handleUpdateStatus = async () => {
    if (!statusDialog.order) return;

    try {
      setIsUpdating(true);
      const response = await fetchWithAuth('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: statusDialog.order.id,
          status: statusDialog.nextStatus,
          tracking_number: statusDialog.nextStatus === 'shipped' ? statusDialog.trackingNumber : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      toast({
        title: 'Order status updated',
        description: `Order marked as ${statusDialog.nextStatus}.`,
      });

      setOrders(prev =>
        prev.map(order =>
          order.id === statusDialog.order?.id
            ? {
                ...order,
                status: statusDialog.nextStatus,
                tracking_number: statusDialog.nextStatus === 'shipped' ? statusDialog.trackingNumber : order.tracking_number,
              }
            : order
        )
      );
      setStatusDialog({ open: false, order: null, nextStatus: 'confirmed', trackingNumber: '' });
    } catch (err: any) {
      console.error('Failed to update order:', err);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err.message || 'Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Track fulfilment status, update tracking numbers, and keep buyers informed.
        </p>
      </div>

      <Card className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_28px_60px_-35px_rgba(15,23,42,0.55)] ring-1 ring-black/5">
        <div className="pointer-events-none absolute inset-0" />
        <CardHeader className="relative z-10 space-y-8 border-b border-slate-200/80 bg-white px-6 py-7 sm:px-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight">Fulfilment health</CardTitle>
              <CardDescription className="text-sm text-muted-foreground/90">
                Monitor outstanding work across the lifecycle.
              </CardDescription>
            </div>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full lg:w-auto">
              <div className="rounded-full border border-slate-200/80 bg-white p-2 shadow-sm">
                <TabsList className="flex flex-wrap justify-start gap-2 bg-transparent p-0 text-[11px]">
                  {STATUS_FILTERS.map(filter => {
                    const count = filter.value === 'all' ? orders.length : statusSummary[filter.value] || 0;
                    return (
                      <TabsTrigger
                        key={filter.value}
                        value={filter.value}
                        className="group flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-[11px] font-semibold capitalize text-muted-foreground transition-all hover:border-slate-300 hover:bg-muted/40 hover:text-foreground data-[state=active]:border-primary/70 data-[state=active]:bg-primary/12 data-[state=active]:text-primary data-[state=active]:shadow-[0_12px_30px_-18px_rgba(37,99,235,0.9)]"
                      >
                        <span>{filter.label}</span>
                        <span
                          className="inline-flex h-5 min-w-[1.35rem] items-center justify-center rounded-full bg-muted/70 px-2 text-[10px] font-bold text-muted-foreground transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground"
                        >
                          {count}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </Tabs>
          </div>
          <div className="grid gap-4 pt-1 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
              <span className="rounded-xl bg-muted/70 p-2"><Package className="h-4 w-4" /></span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Awaiting action</p>
                <p className="text-lg font-semibold tracking-tight">{statusSummary.pending || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
              <span className="rounded-xl bg-muted/70 p-2"><Truck className="h-4 w-4" /></span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">In transit</p>
                <p className="text-lg font-semibold tracking-tight">{statusSummary.shipped || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
              <span className="rounded-xl bg-muted/70 p-2"><CheckCircle2 className="h-4 w-4" /></span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold tracking-tight">{statusSummary.completed || 0}</p>
              </div>
            </div>
          </div>
        </CardHeader>
  <CardContent className="relative z-10 space-y-6 px-6 pb-8 pt-6 text-sm sm:px-9">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white p-10 text-center text-sm shadow-inner">
              <p className="text-muted-foreground">No orders in this state yet. New orders will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-white/80 text-xs uppercase tracking-wide text-muted-foreground">
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id} className="transition-colors hover:bg-muted/40">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold tracking-tight">{order.order_number || order.id}</span>
                          <span className="text-[11px] text-muted-foreground">{formatDate(order.created_at)}</span>
                          <span className="text-[11px] text-muted-foreground">Buyer: {order.buyer_name || 'Hidden'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[order.status || 'pending'] ?? 'secondary'} className="capitalize">
                          {order.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm capitalize">{order.payment_method || '—'}</div>
                        <div className="text-[11px] uppercase text-muted-foreground">{order.payment_status || 'pending'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-[11px]">
                          {(order.items || []).slice(0, 2).map(item => (
                            <div key={`${order.id}-${item.product_id}`} className="truncate">
                              {item.quantity} × {item.product_title}
                            </div>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <div className="text-muted-foreground">+{(order.items?.length || 0) - 2} more</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(order.total_amount || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(order)}>
                          Update status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={statusDialog.open}
        onOpenChange={open =>
          setStatusDialog(prev => ({
            ...prev,
            open,
            order: open ? prev.order : null,
            trackingNumber: open ? prev.trackingNumber : '',
            nextStatus: open && prev.order ? prev.nextStatus : 'confirmed',
          }))
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update order status</DialogTitle>
            <DialogDescription>
              Keep buyers informed about their delivery progress. Tracking number is required when marking an order as shipped.
            </DialogDescription>
          </DialogHeader>

          {statusDialog.order && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-semibold">{statusDialog.order.order_number || statusDialog.order.id}</p>
                <p className="text-xs text-muted-foreground mt-1">Current status: {statusDialog.order.status || 'pending'}</p>
                <p className="text-xs text-muted-foreground">Placed on {formatDate(statusDialog.order.created_at)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next-status">New status</Label>
                <Select
                  value={statusDialog.nextStatus}
                  onValueChange={value =>
                    setStatusDialog(prev => ({ ...prev, nextStatus: value }))
                  }
                >
                  <SelectTrigger id="next-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_UPDATE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option} className="capitalize">
                        {option.replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {statusDialog.nextStatus === 'shipped' && (
                <div className="space-y-2">
                  <Label htmlFor="tracking-number">Tracking number</Label>
                  <Input
                    id="tracking-number"
                    placeholder="e.g. EV123456789GB"
                    value={statusDialog.trackingNumber}
                    onChange={event =>
                      setStatusDialog(prev => ({ ...prev, trackingNumber: event.target.value }))
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Buyers receive an automatic notification once tracking is saved.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setStatusDialog({ open: false, order: null, nextStatus: 'confirmed', trackingNumber: '' })}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={
                isUpdating ||
                !statusDialog.order ||
                (statusDialog.nextStatus === 'shipped' && statusDialog.trackingNumber.trim().length === 0)
              }
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
