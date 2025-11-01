"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useToast } from "@/hooks/use-toast";
import { UserDoc } from "@/lib/firestoreTypes";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { UserProfileCard } from "@/components/admin/users/UserProfileCard";
import { UserActions } from "@/components/admin/users/UserActions";
import { UserAuditLog } from "@/components/admin/users/UserAuditLog";
import { UserStatsCard } from "@/components/admin/users/UserStatsCard";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { uid } = params;
  const { getAdminToken } = useAdminAuth();
  const { toast } = useToast();

  const [user, setUser] = useState<UserDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const token = await getAdminToken();
      if (!token) throw new Error("Authentication failed");

      const response = await fetch(`/api/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else {
        throw new Error(data.error || "Failed to fetch user data");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      router.push("/admin/users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [uid]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        User not found.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/admin/users")}
          className="border-slate-600 hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4 text-slate-300" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            User Details
          </h1>
          <p className="text-slate-400">Manage and review user information</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <UserProfileCard user={user} onUpdate={fetchUserData} />
          <UserAuditLog userId={user.uid} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <UserActions user={user} onUpdate={fetchUserData} />
          <UserStatsCard user={user} />
        </div>
      </div>
    </div>
  );
}
