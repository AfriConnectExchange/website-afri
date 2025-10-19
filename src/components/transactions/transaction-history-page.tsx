
'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Package, Loader2, ArrowRight, ArrowLeft, Download, Search, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { useAuth } from '@/context/auth-context';


export interface Transaction {
    id: string;
    created_at: string;
    type: 'purchase' | 'sale' | 'withdrawal' | 'deposit' | 'escrow_creation' | 'escrow_release';
    status: 'completed' | 'pending' | 'failed' | 'success' | 'failure';
    amount: number;
    description: string;
    order_id: string;
}

function TransactionsSkeleton() {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-3/4" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-1/2" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-1/2" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-1/2" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}

export function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call.
        // For the mock, we simulate fetching and return an empty array.
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTransactions([]);
      } catch (error) {
          toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch transactions.',
            });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [toast, user]);


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
         return 'default';
      case 'pending': return 'secondary';
      default: return 'destructive';
    }
  }

  const getTypeVariant = (type: string) => {
    switch (type) {
        case 'purchase': return 'destructive';
        case 'sale': return 'default';
        case 'withdrawal': return 'secondary';
        case 'deposit': return 'outline';
        case 'escrow_creation': return 'secondary';
        case 'escrow_release': return 'default';
        default: return 'secondary';
    }
  }
  
  const formatAmount = (type: string, amount: number) => {
      if (amount === 0) return '-';
      const sign = type === 'purchase' || type === 'withdrawal' ? '-' : '+';
      return `${sign} £${amount.toFixed(2)}`;
  }


  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-sm text-muted-foreground">
            Review your financial activity and system events on the platform.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by description..." className="pl-10"/>
            </div>
            <Button variant="outline" size="icon"><ListFilter className="w-4 h-4" /></Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Export</Button>
        </div>
      </div>

      {isLoading ? (
        <TransactionsSkeleton />
      ) : transactions.length > 0 ? (
        <Card>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => (
                    <TableRow key={tx.id} className={tx.order_id ? "cursor-pointer" : ""} onClick={() => tx.order_id && router.push(`/tracking?orderId=${tx.order_id}`)}>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{tx.description || tx.type.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                            <Badge variant={getTypeVariant(tx.type)} className="capitalize">{tx.type.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(tx.status)} className="capitalize">{tx.status}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.amount > 0 && (tx.type.includes('purchase') || tx.type.includes('withdrawal')) ? 'text-destructive' : tx.amount > 0 ? 'text-green-600' : ''}`}>
                           {formatAmount(tx.type, tx.amount)}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
      ) : (
         <Card className="border-dashed">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No transactions yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                When you make a purchase or sale, it will appear here.
              </p>
               <Button onClick={() => router.push('/marketplace')}>Start Shopping</Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
