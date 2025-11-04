'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Timer, AlertTriangle, Package, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface SellerOrder {
  id: string;
  status?: string;
  total_amount?: number;
  payment_method?: string;
  created_at?: { seconds: number; nanoseconds: number } | string | null;
  confirmed_at?: { seconds: number; nanoseconds: number } | string | null;
  shipped_at?: { seconds: number; nanoseconds: number } | string | null;
  delivered_at?: { seconds: number; nanoseconds: number } | string | null;
  items?: Array<{
    product_id: string;
    product_title: string;
    quantity: number;
    price: number;
  }>;
}

interface ProductSummary {
  id: string;
  title: string;
  status?: string;
  stock_quantity?: number;
}

const toDate = (input?: SellerOrder['created_at']): Date | null => {
  if (!input) return null;
  if (typeof input === 'string') return new Date(input);
  if (typeof input === 'object' && 'seconds' in input) {
    return new Date(input.seconds * 1000);
  }
  return null;
};

const diffInHours = (start?: SellerOrder['created_at'], end?: SellerOrder['created_at']) => {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return null;
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs <= 0 ? null : diffMs / (1000 * 60 * 60);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }).format(value || 0);

const MONTH_LABEL = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });

export function SellerAnalyticsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [ordersResponse, productsResponse] = await Promise.all([
          fetchWithAuth('/api/orders/seller'),
          fetchWithAuth('/api/products/seller'),
        ]);

        const ordersData = await ordersResponse.json();
        const productsData = await productsResponse.json();

        if (!ordersResponse.ok) {
          throw new Error(ordersData.error || 'Failed to load orders');
        }
        if (!productsResponse.ok) {
          throw new Error(productsData.error || 'Failed to load products');
        }

        setOrders(ordersData.orders || []);
        setProducts(productsData.products || []);
      } catch (err: any) {
        console.error('Failed to load analytics:', err);
        setError(err.message || 'Unable to load analytics');
        toast({
          variant: 'destructive',
          title: 'Analytics unavailable',
          description: err.message || 'Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [toast]);

  const analytics = useMemo(() => {
    if (orders.length === 0) {
      const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - index));
        return {
          label: MONTH_LABEL.format(date),
          revenue: 0,
        };
      });
      return {
        monthlySales: lastSixMonths,
        paymentMix: [],
        topProducts: [],
        fulfilmentHours: null,
        disputeRate: 0,
        pendingOrders: 0,
        gmvl30: 0,
        activeCatalogue: products.filter(p => p.status === 'active').length,
      };
    }

    const now = new Date();
    const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now);
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      return {
        date,
        label: MONTH_LABEL.format(date),
        revenue: 0,
      };
    });

    const monthlyMap = new Map(lastSixMonths.map(item => [item.label, item]));

    const paymentCounter: Record<string, number> = {};
    const completedOrders = orders.filter(order => ['completed', 'delivered'].includes(order.status || ''));
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const disputes = orders.filter(order => order.status === 'disputed').length;

    let gmvl30 = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const shipDurations: number[] = [];
    const deliveryDurations: number[] = [];
    const productPerformance = new Map<string, { title: string; units: number; revenue: number }>();

    orders.forEach(order => {
      if (order.payment_method) {
        const key = order.payment_method;
        paymentCounter[key] = (paymentCounter[key] || 0) + 1;
      } else {
        paymentCounter.other = (paymentCounter.other || 0) + 1;
      }

      const created = toDate(order.created_at);
      if (order.total_amount && created) {
        if (created >= thirtyDaysAgo && ['completed', 'delivered'].includes(order.status || '')) {
          gmvl30 += order.total_amount;
        }

        const monthLabel = MONTH_LABEL.format(created);
        const entry = monthlyMap.get(monthLabel);
        if (entry) {
          entry.revenue += order.total_amount;
        }
      }

      const shipHours = diffInHours(order.confirmed_at || order.created_at, order.shipped_at);
      if (shipHours) {
        shipDurations.push(shipHours);
      }

      const deliveryHours = diffInHours(order.shipped_at, order.delivered_at);
      if (deliveryHours) {
        deliveryDurations.push(deliveryHours);
      }

      if (order.items && ['completed', 'delivered'].includes(order.status || '')) {
        order.items.forEach(item => {
          const revenue = (item.price || 0) * (item.quantity || 0);
          const current = productPerformance.get(item.product_id) || {
            title: item.product_title || 'Untitled listing',
            units: 0,
            revenue: 0,
          };
          current.units += item.quantity || 0;
          current.revenue += revenue;
          productPerformance.set(item.product_id, current);
        });
      }
    });

    const average = (values: number[]) => {
      if (!values.length) return null;
      const total = values.reduce((sum, value) => sum + value, 0);
      return total / values.length;
    };

    const fulfilmentHours = average(deliveryDurations) ?? average(shipDurations);

    const paymentMix = Object.entries(paymentCounter)
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);

    const topProducts = Array.from(productPerformance.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      monthlySales: lastSixMonths.map(item => ({ label: item.label, revenue: item.revenue })),
      paymentMix,
      topProducts,
      fulfilmentHours,
      disputeRate: orders.length === 0 ? 0 : (disputes / orders.length) * 100,
      pendingOrders,
      gmvl30,
      activeCatalogue: products.filter(p => p.status === 'active').length,
    };
  }, [orders, products]);

  const renderPaymentLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'Card';
      case 'cash_on_delivery':
        return 'Cash on delivery';
      case 'mobile_money':
        return 'Mobile money';
      case 'bank_transfer':
        return 'Bank transfer';
      case 'paypal':
        return 'PayPal';
      default:
        return 'Other';
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">Sales & analytics</h1>
        <p className="text-sm text-muted-foreground">
          Understand revenue trends, channel preferences, and catalogue performance.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GMV (last 30 days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-3xl font-bold">{formatCurrency(analytics.gmvl30)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Completed and delivered orders only.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average fulfilment time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : analytics.fulfilmentHours ? (
              <div className="text-3xl font-bold">{(analytics.fulfilmentHours / 24).toFixed(1)}d</div>
            ) : (
              <div className="text-3xl font-bold">—</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Time from dispatch to delivery confirmation.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispute rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{analytics.disputeRate.toFixed(1)}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Keep disputes under 2% for premium status.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active catalogue</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-3xl font-bold">{analytics.activeCatalogue}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Products currently live on the marketplace.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue</CardTitle>
            <CardDescription>Six-month rolling view across completed orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.monthlySales.map(month => (
                    <TableRow key={month.label}>
                      <TableCell>{month.label}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(month.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment mix</CardTitle>
            <CardDescription>Helps prioritise which payment methods to promote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </div>
            ) : analytics.paymentMix.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              analytics.paymentMix.map(entry => {
                const total = analytics.paymentMix.reduce((sum, item) => sum + item.count, 0) || 1;
                const percentage = Math.round((entry.count / total) * 100);
                return (
                  <div key={entry.method} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{renderPaymentLabel(entry.method)}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top products by revenue</CardTitle>
          <CardDescription>Focus inventory and marketing on what customers love.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          ) : analytics.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topProducts.map(product => (
                  <TableRow key={product.title}>
                    <TableCell className="max-w-sm truncate">{product.title}</TableCell>
                    <TableCell className="text-right">{product.units}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
