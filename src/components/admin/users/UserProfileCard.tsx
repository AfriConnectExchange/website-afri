"use client";

import { useState } from "react";
import { UserDoc } from "@/lib/firestoreTypes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStatusBadge, getRoleBadges, getKYCBadge } from "./UserBadge";

interface UserProfileCardProps {
  user: UserDoc;
  onUpdate: () => void;
}

export function UserProfileCard({ user, onUpdate }: UserProfileCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 text-white">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-sky-400">
            <AvatarImage src={user.profile_picture_url || undefined} />
            <AvatarFallback className="bg-slate-700 text-lg">
              {user.display_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{user.display_name || "N/A"}</CardTitle>
            <CardDescription className="text-slate-400">{user.email}</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {getStatusBadge(user.account_status)}
              {getKYCBadge(user.kyc_status)}
              {getRoleBadges(user.roles || [])}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">User ID</p>
            <p className="font-mono text-xs bg-slate-900 p-1 rounded">{user.uid}</p>
          </div>
          <div>
            <p className="text-slate-400">Phone Number</p>
            <p>{user.phone || "Not provided"}</p>
          </div>
          <div>
            <p className="text-slate-400">Joined On</p>
            <p>
              {user.created_at
                ? new Date(user.created_at.seconds * 1000).toLocaleString()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Last Seen</p>
            <p>
              {user.last_seen
                ? new Date(user.last_seen.seconds * 1000).toLocaleString()
                : "N/A"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-slate-400">Primary Address</p>
            <p>{user.address?.formatted_address || "Not provided"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
