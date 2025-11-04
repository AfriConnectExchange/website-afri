"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Dispute {
  id: string;
  order_id: string;
  reason: string;
  status: 'Open' | 'In Review' | 'Resolved';
  raised_by_role: 'buyer' | 'seller';
  created_at: any;
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const { getAdminToken } = useAdminAuth();
  const { toast } = useToast();
  
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Open");

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    filterDisputes();
  }, [searchQuery, statusFilter, disputes]);

  const fetchDisputes = async () => {
    try {
      const token = await getAdminToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/admin/disputes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDisputes(data.disputes);
        setFilteredDisputes(data.disputes);
      } else {
        throw new Error(data.error || "Failed to load disputes");
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDisputes = () => {
    let filtered = [...disputes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dispute) =>
          dispute.order_id.toLowerCase().includes(query) ||
          dispute.id.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((dispute) => dispute.status === statusFilter);
    }

    setFilteredDisputes(filtered);
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'Open': return <Badge variant="destructive">Open</Badge>;
        case 'In Review': return <Badge variant="secondary">In Review</Badge>;
        case 'Resolved': return <Badge variant="default">Resolved</Badge>;
        default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Dispute Resolution</h1>
        <p className="text-slate-600">Manage and resolve user disputes.</p>
      </div>

      <Card className="bg-white mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by Order or Dispute ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Disputes</CardTitle>
          <CardDescription>{filteredDisputes.length} of {disputes.length} disputes showing</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No disputes found</h3>
              <p className="mt-1 text-sm text-gray-500">No disputes match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Raised By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono text-xs">{dispute.id}</TableCell>
                      <TableCell>{dispute.order_id}</TableCell>
                      <TableCell>{dispute.reason}</TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell className="capitalize">{dispute.raised_by_role}</TableCell>
                      <TableCell>
                        {dispute.created_at
                          ? new Date(dispute.created_at._seconds * 1000).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/admin/disputes/${dispute.id}`)}
                          className="text-sky-700 hover:text-sky-600 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
