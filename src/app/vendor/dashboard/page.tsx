 'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, TrendingUp, DollarSign, PlusCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading stats - replace with actual API call later
        setTimeout(() => {
            setStats({
                totalProducts: 12,
                activeProducts: 8,
                totalOrders: 45,
                pendingOrders: 3,
                totalRevenue: 2450.00,
                monthlyRevenue: 890.00
            });
            setIsLoading(false);
        }, 1000);
    }, []);

    const StatCard = ({ title, value, icon: Icon, description, isLoading }: any) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <>
                        <Skeleton className="h-8 w-24 mb-1" />
                        <Skeleton className="h-4 w-32" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here's what's happening with your store today.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Products"
                    value={stats.totalProducts}
                    icon={Package}
                    description={`${stats.activeProducts} active listings`}
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={ShoppingCart}
                    description={`${stats.pendingOrders} pending orders`}
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total Revenue"
                    value={`£${stats.totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    description="All time earnings"
                    isLoading={isLoading}
                />
                <StatCard
                    title="This Month"
                    value={`£${stats.monthlyRevenue.toFixed(2)}`}
                    icon={TrendingUp}
                    description="Revenue this month"
                    isLoading={isLoading}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common tasks to manage your store
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button 
                            className="w-full justify-start" 
                            variant="outline"
                            onClick={() => router.push('/vendor/add-product')}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Product
                        </Button>
                        <Button 
                            className="w-full justify-start" 
                            variant="outline"
                            onClick={() => router.push('/vendor/sales')}
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            View Orders
                        </Button>
                        <Button 
                            className="w-full justify-start" 
                            variant="outline"
                            onClick={() => router.push('/vendor/products')}
                        >
                            <Package className="mr-2 h-4 w-4" />
                            Manage Products
                        </Button>
                        <Button 
                            className="w-full justify-start" 
                            variant="outline"
                            onClick={() => router.push('/marketplace')}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            View Marketplace
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>
                            Tips to grow your business
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-sm">
                            <h4 className="font-medium mb-1">📦 List your first product</h4>
                            <p className="text-muted-foreground text-xs">
                                Add high-quality photos and detailed descriptions to attract buyers.
                            </p>
                        </div>
                        <div className="text-sm">
                            <h4 className="font-medium mb-1">⚡ Keep your inventory updated</h4>
                            <p className="text-muted-foreground text-xs">
                                Regular updates help maintain customer trust and improve visibility.
                            </p>
                        </div>
                        <div className="text-sm">
                            <h4 className="font-medium mb-1">💬 Respond to customers quickly</h4>
                            <p className="text-muted-foreground text-xs">
                                Fast responses lead to better reviews and repeat customers.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Your latest orders and updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No recent activity. Your orders will appear here once customers start purchasing.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
