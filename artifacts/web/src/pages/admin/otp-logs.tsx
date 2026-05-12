import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Send, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRY_FLAG: Record<string, string> = { ng: "🇳🇬", us: "🇺🇸", uk: "🇬🇧", unknown: "🌐" };

function statusBadge(status: string) {
  switch (status) {
    case "verified": return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
    case "sent": return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100"><Send className="h-3 w-3 mr-1" />Sent</Badge>;
    case "failed": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    case "expired": return <Badge className="bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-100"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    case "pending": return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

interface OtpLog {
  id: number;
  requestId: string;
  phoneNumber: string;
  status: string;
  country: string | null;
  createdAt: string;
  userId: number;
  userEmail: string;
  userName: string;
}

export default function AdminOtpLogs() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const token = localStorage.getItem("whatotp_token");

  const { data: logs, isLoading, refetch, isFetching } = useQuery<OtpLog[]>({
    queryKey: ["admin-otp-logs", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/otp-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    staleTime: 30_000,
  });

  const statCounts = logs?.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OTP Logs</h1>
          <p className="text-muted-foreground mt-1">All OTP requests across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Verified", key: "verified", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          { label: "Sent", key: "sent", color: "text-blue-600 bg-blue-50 border-blue-200" },
          { label: "Failed", key: "failed", color: "text-red-600 bg-red-50 border-red-200" },
          { label: "Expired", key: "expired", color: "text-orange-600 bg-orange-50 border-orange-200" },
          { label: "Pending", key: "pending", color: "text-gray-600 bg-gray-50 border-gray-200" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)}
            className={`rounded-xl border p-3 text-left transition-all ${statusFilter === s.key ? s.color : "border-border bg-background hover:bg-muted/50"}`}
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${statusFilter === s.key ? "" : ""}`}>
              {statCounts[s.key] ?? 0}
            </p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Request History</CardTitle>
          <CardDescription>Most recent 100 OTP requests {statusFilter !== "all" ? `with status: ${statusFilter}` : ""}.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm font-medium">{log.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.userName}</div>
                      <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                    </TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                    <TableCell className="text-lg">{COUNTRY_FLAG[log.country || "unknown"] ?? "🌐"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.requestId.slice(0, 20)}…</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">No OTP logs found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
