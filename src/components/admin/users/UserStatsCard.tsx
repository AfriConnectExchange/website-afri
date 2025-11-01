"use client";

import { UserDoc } from "@/lib/firestoreTypes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingBag, Package, Star } from "lucide-react";

interface UserStatsCardProps {
  user: UserDoc & { stats?: { order_count: number; product_count: number; review_count: number } };
}

export function UserStatsCard({ user }: UserStatsCardProps) {
  const stats = [
    {
      label: "Total Orders",
      value: user.stats?.order_count ?? 0,
      icon: ShoppingBag,
    },
    {
      label: "Active Listings",
      value: user.stats?.product_count ?? 0,
      icon: Package,
    },
    {
      label: "Reviews Written",
      value: user.stats?.review_count ?? 0,
      icon: Star,
    },
  ];

  return (
    <Card className="bg-slate-800 border-slate-700 text-white">
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-slate-400" />
              <p className="text-sm text-slate-300">{stat.label}</p>
            </div>
            <p className="font-bold text-lg">{stat.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
