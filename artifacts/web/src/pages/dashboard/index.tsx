import { useGetDashboardStats, useGetCurrentSubscription, useListPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Send, XCircle, AlertCircle, Zap, ArrowRight, Lock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

type StatsData = {
  otpSentToday: number;
  otpSentMonth: number;
  otpSuccessRate: number;
  remainingOtps: number;
  planName: string | null;
  hasSubscription: boolean;
  activeApiKeys: number;
  recentActivity: any[];
};

function FreemiumBanner({ stats }: { stats: StatsData }) {
  const { remainingOtps, planName, hasSubscription } = stats;

  if (!hasSubscription) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 text-sm">Subscribe to start sending OTPs</p>
            <p className="text-sm text-blue-700/80">Pick a plan to activate your account. The Free plan gives you 10 OTPs/month at no cost.</p>
          </div>
        </div>
        <Link href="/dashboard/subscription">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
            Choose Plan <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  const isFree = planName === "Free";
  const isNearLimit = remainingOtps <= 3 && remainingOtps > 0;
  const isAtLimit = remainingOtps === 0;

  if (isAtLimit && isFree) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-destructive text-sm">Free plan OTP limit reached</p>
            <p className="text-sm text-muted-foreground">You've used all 10 free OTPs this month. Upgrade to keep sending without limits.</p>
          </div>
        </div>
        <Link href="/dashboard/subscription">
          <Button size="sm" className="bg-destructive text-white hover:bg-destructive/90 flex-shrink-0">
            Upgrade Now <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className="rounded-xl border border-orange-300/60 bg-orange-50 p-4 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-orange-700 text-sm">Only {remainingOtps} OTP{remainingOtps !== 1 ? "s" : ""} remaining ({planName} plan)</p>
            <p className="text-sm text-orange-600/80">Upgrade before you run out to avoid disrupting your users.</p>
          </div>
        </div>
        <Link href="/dashboard/subscription">
          <Button size="sm" variant="outline" className="border-orange-400 text-orange-700 hover:bg-orange-100 flex-shrink-0">
            Upgrade Plan <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Free plan · {remainingOtps} OTP{remainingOtps !== 1 ? "s" : ""} remaining this month</p>
            <p className="text-sm text-emerald-700/80">
              Free messages include "AchekOTP" branding. Upgrade to remove it, get 500+ OTPs/month, and unlock custom templates.
            </p>
          </div>
        </div>
        <Link href="/dashboard/subscription">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0">
            View Plans <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-20" /></CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typedStats = stats as unknown as StatsData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "sent": return <Send className="h-4 w-4 text-blue-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
      case "expired": return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge variant="default" className="bg-primary hover:bg-primary/90">Verified</Badge>;
      case "sent": return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case "failed": return <Badge variant="destructive">Failed</Badge>;
      case "expired": return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAtLimit = typedStats?.hasSubscription && typedStats?.remainingOtps === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your API usage and activity.</p>
        </div>
      </div>

      {typedStats && <FreemiumBanner stats={typedStats} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OTPs Sent (Today)</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typedStats?.otpSentToday?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Messages successfully delivered</p>
          </CardContent>
        </Card>
        <Card className={isAtLimit ? "border-destructive/40 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining OTPs</CardTitle>
            <AlertCircle className={`h-4 w-4 ${isAtLimit ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isAtLimit ? "text-destructive" : ""}`}>
              {typedStats?.remainingOtps?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAtLimit ? (
                <Link href="/dashboard/subscription"><span className="text-destructive underline cursor-pointer">Upgrade to keep sending</span></Link>
              ) : `This billing cycle · ${typedStats?.planName || "No plan"}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typedStats?.otpSuccessRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Verification conversion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typedStats?.activeApiKeys || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Keys with traffic in last 24h</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent OTP Activity</CardTitle>
          <CardDescription>The latest verification requests from your users.</CardDescription>
        </CardHeader>
        <CardContent>
          {typedStats?.recentActivity && typedStats.recentActivity.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedStats.recentActivity.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No activity yet</p>
              <p className="text-xs mt-1">Send your first OTP using your API key to see activity here.</p>
              <Link href="/dashboard/api-keys">
                <Button size="sm" variant="outline" className="mt-4">Get API Key</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
