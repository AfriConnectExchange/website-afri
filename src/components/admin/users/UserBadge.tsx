"use client";

import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status?: string) => {
  const s = status || "active";
  const variants: Record<string, { variant: any; label: string }> = {
    active: { variant: "default", label: "Active" },
    suspended: { variant: "destructive", label: "Suspended" },
    deactivated: { variant: "destructive", label: "Deactivated" },
    pending_email: { variant: "secondary", label: "Pending Email" },
  };

  const config = variants[s] || variants.active;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const getRoleBadges = (roles: string[]) => {
  if (!roles || roles.length === 0) {
    return <Badge variant="outline">No Role</Badge>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge
          key={role}
          variant="outline"
          className={
            role === "admin"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : role === "seller" || role === "sme"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : ""
          }
        >
          {role.toUpperCase()}
        </Badge>
      ))}
    </div>
  );
};

export const getKYCBadge = (status?: string) => {
  const variants: Record<string, { variant: any; label: string }> = {
    verified: { variant: "default", label: "Verified" },
    pending: { variant: "secondary", label: "Pending" },
    rejected: { variant: "destructive", label: "Rejected" },
    unverified: { variant: "outline", label: "Unverified" },
  };

  const s = status || "unverified";
  const config = variants[s] || variants.unverified;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
