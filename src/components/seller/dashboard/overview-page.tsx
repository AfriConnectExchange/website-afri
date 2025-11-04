'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle, TrendingUp, Package, ClipboardList, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ProductSummary {
  id: string;
  title: string;
  status?: string;
  stock_quantity?: number;
  price?: number;
}

interface OrderSummary {
  id: string;
  order_number?: string;
  status?: string;
  total_amount?: number;
  created_at?: { seconds: number; nanoseconds: number } | string | null;
  buyer_name?: string;
  payment_method?: string;
}

interface ReviewSummary {
  id: string;
  rating: number;
  comment: string;
  created_at?: { seconds: number; nanoseconds: number } | string | null;
  reviewer_name?: string;
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  shipped: 'default',
  delivered: 'default',
  completed: 'default',
  cancelled: 'destructive',
  disputed: 'destructive',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const toDate = (input?: OrderSummary['created_at']): Date | null => {
  if (!input) return null;
  if (typeof input === 'string') return new Date(input);
  if (typeof input === 'object' && 'seconds' in input) {
    return new Date(input.seconds * 1000);
  }
  return null;
};

const formatDate = (input?: OrderSummary['created_at']) => {
  const date = toDate(input);
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

export function SellerOverviewPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ratingStats, setRatingStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [productsResponse, ordersResponse, reviewsResponse] = await Promise.all([
          fetchWithAuth('/api/products/seller'),
          fetchWithAuth('/api/orders/seller'),
          fetchWithAuth('/api/reviews/seller'),
        ]);

        const productsData = await productsResponse.json();
        const ordersData = await ordersResponse.json();
        const reviewsData = await reviewsResponse.json();

        if (!productsResponse.ok) {
          throw new Error(productsData.error || 'Failed to load products');
        }
        if (!ordersResponse.ok) {
          throw new Error(ordersData.error || 'Failed to load orders');
        }
        if (!reviewsResponse.ok) {
          throw new Error(reviewsData.error || 'Failed to load reviews');
        }

        if (!isMounted) return;

        setProducts(productsData.products || []);
        setOrders(ordersData.orders || []);

        const totalReviews = reviewsData.stats?.total_reviews || 0;
        const averageRating = reviewsData.stats?.average_rating || 0;
        setRatingStats({ average: averageRating, count: totalReviews });
      } catch (err: any) {
        console.error('Failed to load seller overview:', err);
        if (!isMounted) return;
        setError(err.message || 'Unable to load seller overview');
        toast({
          variant: 'destructive',
          title: 'Failed to load overview',
          description: err.message || 'Please try again shortly.',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const metrics = useMemo(() => {
    const activeProducts = products.filter(p => p.status === 'active').length;
    const outOfStock = products.filter(p => (p.stock_quantity ?? 0) === 0).length;

    const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const revenueLast30Days = orders.reduce((sum, order) => {
      if (order.status !== 'completed' && order.status !== 'delivered') return sum;
      const created = toDate(order.created_at);
      if (!created) return sum;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (created >= thirtyDaysAgo) {
        return sum + (order.total_amount || 0);
      }
      return sum;
    }, 0);

    const recentOrders = [...orders]
      .sort((a, b) => {
        const dateB = toDate(b.created_at)?.getTime() || 0;
        const dateA = toDate(a.created_at)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    return {
      activeProducts,
      outOfStock,
      pendingOrders: statusCounts.pending || 0,
      inFulfilment: (statusCounts.confirmed || 0) + (statusCounts.shipped || 0),
      revenueLast30Days,
      recentOrders,
    };
  }, [orders, products]);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">Seller overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor performance, fulfil outstanding orders, and stay on top of customer feedback.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-3xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to fetch everything</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="border-dashed">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.activeProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics.outOfStock} low / out of stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders requiring action</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics.inFulfilment} already in fulfilment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (last 30 days)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(metrics.revenueLast30Days)}</div>
              <p className="text-xs text-muted-foreground mt-1">Paid and delivered orders only</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{ratingStats.average.toFixed(1)}<span className="text-base font-medium text-muted-foreground">/5</span></div>
              <p className="text-xs text-muted-foreground mt-1">Based on {ratingStats.count} verified reviews</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Latest orders</CardTitle>
            <CardDescription>Keep momentum—confirm fulfilment within 24 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : metrics.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet. Once you receive orders they will appear here.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.recentOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.order_number || order.id}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[order.status || 'pending'] ?? 'secondary'} className="capitalize">
                          {order.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.buyer_name || 'Buyer hidden'}</span>
                        <div className="text-xs text-muted-foreground capitalize">{order.payment_method || '—'}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total_amount || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Next best actions</CardTitle>
            <CardDescription>Complete these to stay compliant with marketplace standards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">Keep fulfilment SLAs green</p>
              <p className="text-xs text-muted-foreground mt-1">Confirm or ship pending orders within 24 hours to maintain fast-delivery status.</p>
            </div>
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">Update stock levels</p>
              <p className="text-xs text-muted-foreground mt-1">{metrics.outOfStock > 0 ? `${metrics.outOfStock} listings are out of stock—restock or archive them.` : 'All listings are in stock. Great job keeping your catalogue updated.'}</p>
            </div>
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">Respond to new reviews</p>
              <p className="text-xs text-muted-foreground mt-1">Reply to thank positive reviewers or resolve issues to boost trust.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
