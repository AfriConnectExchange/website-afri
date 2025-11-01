"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminAuth } from "@/context/admin-auth-context";
import { Loader2, FileText } from "lucide-react";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  reason: string;
  timestamp: any;
}

export function UserAuditLog({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getAdminToken } = useAdminAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = await getAdminToken();
        const response = await fetch(`/api/admin/audit-logs?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [userId]);

  return (
    <Card className="bg-slate-800 border-slate-700 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Admin Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-slate-400 text-center py-4">
            No admin actions recorded for this user.
          </p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sky-400">
                      {log.action.replace(/_/g, " ").toUpperCase()}
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      <span className="font-medium">Reason:</span> {log.reason}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 text-right flex-shrink-0 ml-4">
                    {new Date(log.timestamp._seconds * 1000).toLocaleString()}
                    <br />
                    by {log.admin_id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
