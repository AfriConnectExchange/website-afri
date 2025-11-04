'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, FileText, History, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface ApiTransaction {
  transaction_id?: string;
  transaction_type?: string;
  amount?: number;
  currency?: string;
  status?: string;
  order_id?: string;
  method?: string;
  description?: string;
  title?: string;
  date?: string;
  offer_estimated_value?: number;
  payment_method?: string;
}

interface TransactionRow {
  id: string;
  type: 'payment' | 'barter' | 'escrow' | 'other';
  status: string;
  method: string;
  orderId: string;
  amount: number | null;
  currency: string;
  description: string;
  date: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const formatCurrency = (amount: number | null, currency: string) => {
  if (amount === null) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP',
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (iso?: string) => {
  if (!iso) return 'Unknown';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
};

const TYPE_LABEL: Record<TransactionRow['type'], string> = {
  payment: 'Online payment',
  barter: 'Barter exchange',
  escrow: 'Escrow movement',
  other: 'Other',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  success: 'default',
  paid: 'default',
  pending: 'secondary',
  queued: 'secondary',
  processing: 'secondary',
  failed: 'destructive',
  cancelled: 'destructive',
  disputed: 'destructive',
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'All transactions' },
  { value: 'payment', label: 'Payments' },
  { value: 'escrow', label: 'Escrow' },
  { value: 'barter', label: 'Barter deals' },
];

const DEFAULT_PAGINATION: Pagination = { page: 1, limit: 20, total: 0, total_pages: 1 };

export function SellerTransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTransactions(1, typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const loadTransactions = async (page: number, type: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const query = new URLSearchParams({ page: String(page), limit: '20', type });
      const response = await fetchWithAuth(`/api/transactions?${query.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      const rows: TransactionRow[] = (data.transactions || []).map((tx: ApiTransaction) => {
        const typeValue = (tx.transaction_type || 'other') as TransactionRow['type'];
        const amount = typeof tx.amount === 'number' ? tx.amount : typeof tx.offer_estimated_value === 'number' ? tx.offer_estimated_value : null;
        const currency = tx.currency || 'GBP';
        const status = (tx.status || 'unknown').toLowerCase();
        const method = tx.method || tx.payment_method || '—';
        const description = tx.description || tx.title || TYPE_LABEL[typeValue] || 'Transaction';

        return {
          id: tx.transaction_id || crypto.randomUUID(),
          type: TYPE_LABEL[typeValue] ? typeValue : 'other',
          status,
          method,
          orderId: tx.order_id || '—',
          amount,
          currency,
          description,
          date: tx.date || new Date().toISOString(),
        };
      });

  setTransactions(rows);
  setPagination(data.pagination || DEFAULT_PAGINATION);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError(err.message || 'Unable to load transactions');
      toast({
        variant: 'destructive',
        title: 'Transactions unavailable',
        description: err.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.trim().toLowerCase();
    return transactions.filter(tx =>
      tx.description.toLowerCase().includes(term) ||
      tx.orderId.toLowerCase().includes(term) ||
      tx.method.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  const handlePageChange = (direction: 'prev' | 'next') => {
    const nextPage = direction === 'prev' ? Math.max(1, pagination.page - 1) : Math.min(pagination.total_pages, pagination.page + 1);
    if (nextPage === pagination.page) return;
    loadTransactions(nextPage, typeFilter);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      const response = await fetchWithAuth('/api/transactions/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `africonnect-transactions-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const html = await response.text();
        const popup = window.open('', '_blank');
        if (popup) {
          popup.document.write(html);
          popup.document.close();
        } else {
          toast({
            variant: 'destructive',
            title: 'Pop-up blocked',
            description: 'Allow pop-ups from AfriConnect to view the PDF export.',
          });
        }
      }

      toast({
        title: `Export ready`,
        description: format === 'csv' ? 'CSV download started.' : 'PDF opened in a new tab.',
      });
    } catch (err: any) {
      console.error('Export failed:', err);
      toast({
        variant: 'destructive',
        title: 'Could not export',
        description: err.message || 'Please try again later.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">Transaction history</h1>
        <p className="text-sm text-muted-foreground">
          Review every payment, escrow release, and barter exchange. Export records for accounting or compliance.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Showing the most recent 20 records. Adjust filters to drill into specific flows.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="capitalize">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative sm:w-64">
                <Input
                  placeholder="Search description or order#"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport('pdf')} disabled={isExporting}>
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  PDF
                </Button>
                <Button onClick={() => handleExport('csv')} disabled={isExporting}>
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
              No transactions match your filters yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map(tx => {
                  const badgeVariant = STATUS_VARIANT[tx.status as keyof typeof STATUS_VARIANT] ?? 'secondary';
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="flex items-center gap-2 text-sm">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span>{TYPE_LABEL[tx.type]}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant} className="capitalize">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{tx.method}</TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell className="text-sm font-mono">{tx.orderId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(tx.date)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(tx.amount, tx.currency)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
            <span>
              Page {pagination.page} of {pagination.total_pages} · {pagination.total} records total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange('prev')}
                disabled={isLoading || pagination.page === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange('next')}
                disabled={isLoading || pagination.page === pagination.total_pages}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
