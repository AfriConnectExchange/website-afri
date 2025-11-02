"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Shield, Package, ShoppingBag, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/admin-auth-context";

interface DashboardStats {
  totalUsers: number;
  activeSellers: number;
  pendingKYC: number;
  totalProducts: number;
  activeOrders: number;
  openDisputes: number;
}

export default function AdminDashboardPage() {
  const { getAdminToken } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSellers: 0,
    pendingKYC: 0,
    totalProducts: 0,
    activeOrders: 0,
    openDisputes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = await getAdminToken();
      const response = await fetch("/api/admin/dashboard/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Active Sellers",
      value: stats.activeSellers,
      icon: UserCheck,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Pending KYC",
      value: stats.pendingKYC,
      icon: Shield,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      icon: ShoppingBag,
      color: "from-indigo-500 to-blue-500",
    },
    {
      title: "Open Disputes",
      value: stats.openDisputes,
      icon: AlertCircle,
      color: "from-red-500 to-orange-500",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Welcome to the AfriConnect admin portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-2`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-20 bg-slate-200 animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/users"
              className="p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Users className="h-6 w-6 text-sky-600 mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Manage Users</h3>
              <p className="text-sm text-slate-600">View and manage all users</p>
            </a>
            <a
              href="/admin/kyc"
              className="p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Shield className="h-6 w-6 text-orange-600 mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Review KYC</h3>
              <p className="text-sm text-slate-600">Approve or reject KYC submissions</p>
            </a>
            <a
              href="/admin/categories"
              className="p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Package className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Categories</h3>
              <p className="text-sm text-slate-600">Manage product categories</p>
            </a>
            <a
              href="/admin/audit"
              className="p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <AlertCircle className="h-6 w-6 text-red-600 mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Audit Logs</h3>
              <p className="text-sm text-slate-600">View all admin actions</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
