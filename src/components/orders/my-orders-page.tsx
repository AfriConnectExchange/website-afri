'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';
import { ProfileSummaryCard } from '../profile/profile-summary-card';
import { useUser } from '@/firebase';

// This would be a more detailed type in a real app
interface Order {
    id: string;
    date: string;
    status: string;
    total: number;
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
    </div>
  )
}


export function MyOrdersPage() {
  const [ongoingOrders, setOngoingOrders] = useState<Order[]>([]);
  const [canceledOrders, setCanceledOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        // This would fetch from a real API
        await new Promise(resolve => setTimeout(resolve, 1000));
        // For now, we simulate an empty state
        setOngoingOrders([]);
        setCanceledOrders([]);

      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch orders.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);
  
  const EmptyOrdersState = () => (
    <Card className="border-dashed">
        <CardContent className="py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">You have placed no orders yet!</h3>
            <p className="text-sm text-muted-foreground mb-4">
                All your orders will be saved here for you to access their state anytime.
            </p>
            <Button onClick={() => router.push('/marketplace')}>Continue Shopping</Button>
        </CardContent>
    </Card>
  )

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 lg:sticky top-24">
             <ProfileSummaryCard 
                user={user} 
                onNavigate={router.push} 
                activeTab="orders"
                setActiveTab={(tab) => router.push(`/${tab}`)}
             />
        </div>

        <div className="lg:col-span-3">
             <h1 className="text-2xl font-bold mb-4">Orders</h1>
             <Tabs defaultValue="ongoing">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="ongoing">ONGOING/DELIVERED ({ongoingOrders.length})</TabsTrigger>
                    <TabsTrigger value="canceled">CANCELED/RETURNED ({canceledOrders.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="ongoing">
                    {isLoading ? <OrdersSkeleton /> : 
                        ongoingOrders.length === 0 ? <EmptyOrdersState /> : <div>Ongoing orders list</div>
                    }
                </TabsContent>
                 <TabsContent value="canceled">
                     {isLoading ? <OrdersSkeleton /> : 
                        canceledOrders.length === 0 ? <EmptyOrdersState /> : <div>Canceled orders list</div>
                    }
                </TabsContent>
            </Tabs>
        </div>
    </div>
  );
}
