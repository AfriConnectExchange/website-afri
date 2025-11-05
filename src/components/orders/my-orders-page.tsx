
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';
import { ProfileSummaryCard } from '../profile/profile-summary-card';
import { useAuth } from '@/context/auth-context';
import { fetchWithAuth } from '@/lib/api';
import { Badge } from '../ui/badge';
import Image from 'next/image';

// This would be a more detailed type in a real app
interface Order {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    items: Array<{
      product_title: string;
      image: string;
    }>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ongoing');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const res = await fetchWithAuth(`/api/orders/buyer`);
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to fetch orders');
        }
        setOrders(data.orders || []);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch orders.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, toast]);
  
  const ongoingOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'completed' && o.status !== 'delivered');
  const pastOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'completed' || o.status === 'delivered');


  const OrderCard = ({ order }: {order: Order}) => (
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <div className="font-semibold">Order #{order.id.substring(0, 8)}</div>
          <div className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</div>
           <div className="flex items-center gap-2 mt-2">
            {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="w-12 h-12 rounded bg-muted overflow-hidden">
                    <Image src={item.image || '/placeholder.svg'} alt={item.product_title} width={48} height={48} className="object-cover w-full h-full" />
                </div>
            ))}
            {order.items.length > 3 && (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    +{order.items.length - 3} more
                </div>
            )}
           </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="font-bold">£{order.total_amount.toFixed(2)}</div>
          <Badge variant={order.status === 'completed' || order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">{order.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => router.push(`/tracking/${order.id}`)}>Track Order</Button>
        </div>
      </CardContent>
    </Card>
  )

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
                activeTab={activeTab}
                setActiveTab={(tab) => router.push(`/${tab}`)}
             />
        </div>

        <div className="lg:col-span-3">
             <h1 className="text-2xl font-bold mb-4">Orders</h1>
             <Tabs defaultValue="ongoing" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="ongoing">ONGOING ({ongoingOrders.length})</TabsTrigger>
                    <TabsTrigger value="past">PAST ({pastOrders.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="ongoing" className="space-y-4">
                    {isLoading ? <OrdersSkeleton /> : 
                        ongoingOrders.length === 0 ? <EmptyOrdersState /> : ongoingOrders.map(o => <OrderCard key={o.id} order={o} />)
                    }
                </TabsContent>
                 <TabsContent value="past" className="space-y-4">
                     {isLoading ? <OrdersSkeleton /> : 
                        pastOrders.length === 0 ? <EmptyOrdersState /> : pastOrders.map(o => <OrderCard key={o.id} order={o} />)
                    }
                </TabsContent>
            </Tabs>
        </div>
    </div>
  );
}
