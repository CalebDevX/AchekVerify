import { useGetDashboardStats, useGetCurrentSubscription } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Clock, Send, XCircle, AlertCircle, Zap,
  ArrowRight, Lock, CreditCard, Key, Activity, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function UsageBanner({ stats }: { stats: StatsData }) {
  const { remainingOtps, planName, hasSubscription } = stats;

  if (!hasSubscription) {
    return (
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2 flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Subscribe to start sending OTPs</p>
            <p className="text-sm text-blue-700/80 mt-0.5">Pick a plan to activate your account. The Free plan gives you 10 OTPs/month at no cost.</p>
          </div>
        </div>
        <Link href="/dashboard/subscription">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 shadow-sm">
            Choose Plan <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  const isFree = planName === "Free";
  const isAtLimit = remainingOtps === 0;
  const isNearLimit = remainingOtps <= 3 && remainingOtps > 0;

  if (isAtLimit) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-gradient-to-r from-red-50 to-rose-50 p-5 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2 flex-shrink-0">
            <Lock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-900">OTP limit reached — {planName} plan</p>
            <p className="text-sm text-red-700/80 mt-0.5">
              {isFree ? "You've used all 10 free OTPs this month." : "All your OTPs for this cycle are used."} Upgrade to keep sending.
            </p>
          </div>
        </div>
        <Link href="/dashboard/subscription">
          <Button className="bg-red-600 hover:bg-red-700 text-white flex-shrink-0 shadow-sm">
            Upgrade Now <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-orange-100 p-2 flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-orange-800">Only {remainingOtps} OTP{remainingOtps !== 1 ? "s" : ""} remaining — {planName} plan</p>
            <p className="text-sm text-orange-700/80 mt-0.5">Upgrade before you run out to avoid disrupting your users.</p>
          </div>
        </div>
        <Link href="/dashboard/subscription">
          <Button variant="outline" className="border-orange-400 text-orange-700 hover:bg-orange-100 flex-shrink-0">
            Upgrade Plan <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "verified": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "sent": return <Send className="h-4 w-4 text-blue-500" />;
    case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
    case "expired": return <AlertCircle className="h-4 w-4 text-orange-400" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "verified": return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border hover:bg-emerald-100">Verified</Badge>;
    case "sent": return <Badge className="bg-blue-100 text-blue-800 border-blue-200 border hover:bg-blue-100">Sent</Badge>;
    case "failed": return <Badge variant="destructive">Failed</Badge>;
    case "expired": return <Badge className="bg-orange-50 text-orange-700 border-orange-200 border hover:bg-orange-50">Expired</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: subscription } = useGetCurrentSubscription();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  const typedStats = stats as unknown as StatsData;
  const planName = typedStats?.planName ?? null;
  const otpLimit = (subscription as any)?.plan?.otpLimit ?? null;
  const otpUsed = (subscription as any)?.otpUsed ?? 0;
  const usagePercent = otpLimit && otpLimit > 0 ? Math.min(100, Math.round((otpUsed / otpLimit) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your API activity overview.</p>
        </div>
        <Link href="/dashboard/api-keys">
          <Button variant="outline" className="flex items-center gap-2 flex-shrink-0">
            <Key className="h-4 w-4" /> API Keys
          </Button>
        </Link>
      </div>

      {typedStats && <UsageBanner stats={typedStats} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wide">OTPs Today</p>
              <Send className="h-4 w-4 text-emerald-200" />
            </div>
            <p className="text-3xl font-bold mt-2">{(typedStats?.otpSentToday ?? 0).toLocaleString()}</p>
            <p className="text-xs text-emerald-100 mt-1">Messages sent today</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide">This Month</p>
              <TrendingUp className="h-4 w-4 text-blue-200" />
            </div>
            <p className="text-3xl font-bold mt-2">{(typedStats?.otpSentMonth ?? 0).toLocaleString()}</p>
            <p className="text-xs text-blue-100 mt-1">Total OTPs sent</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-violet-100 uppercase tracking-wide">Success Rate</p>
              <CheckCircle2 className="h-4 w-4 text-violet-200" />
            </div>
            <p className="text-3xl font-bold mt-2">{typedStats?.otpSuccessRate ?? 0}%</p>
            <p className="text-xs text-violet-100 mt-1">Verification rate</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-amber-100 uppercase tracking-wide">Active Keys</p>
              <Key className="h-4 w-4 text-amber-200" />
            </div>
            <p className="text-3xl font-bold mt-2">{typedStats?.activeApiKeys ?? 0}</p>
            <p className="text-xs text-amber-100 mt-1">API keys in use</p>
          </CardContent>
        </Card>
      </div>

      {typedStats?.hasSubscription && otpLimit && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  OTP Usage — {planName} Plan
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {otpUsed.toLocaleString()} used of {otpLimit.toLocaleString()} OTPs this billing cycle
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${usagePercent >= 90 ? "text-red-500" : usagePercent >= 70 ? "text-orange-500" : "text-emerald-600"}`}>
                  {usagePercent}%
                </p>
                <p className="text-xs text-muted-foreground">{(typedStats?.remainingOtps ?? 0).toLocaleString()} remaining</p>
              </div>
            </div>
            <Progress
              value={usagePercent}
              className={`h-2.5 ${usagePercent >= 90 ? "[&>div]:bg-red-500" : usagePercent >= 70 ? "[&>div]:bg-orange-500" : "[&>div]:bg-emerald-500"}`}
            />
            {usagePercent >= 70 && (
              <div className="flex justify-end mt-3">
                <Link href="/dashboard/subscription">
                  <Button size="sm" variant="outline" className="text-xs">
                    Upgrade Plan <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/api-keys">
          <Card className="cursor-pointer hover:shadow-md transition-all hover:border-blue-300 border">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2.5">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">API Keys</p>
                <p className="text-xs text-muted-foreground">Manage your access tokens</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/logs">
          <Card className="cursor-pointer hover:shadow-md transition-all hover:border-emerald-300 border">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">OTP Logs</p>
                <p className="text-xs text-muted-foreground">Full activity history</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/subscription">
          <Card className="cursor-pointer hover:shadow-md transition-all hover:border-violet-300 border">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2.5">
                <CreditCard className="h-5 w-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Subscription</p>
                <p className="text-xs text-muted-foreground">View & upgrade your plan</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" /> Recent OTP Activity
          </CardTitle>
          <CardDescription>The latest verification requests from your users.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {typedStats?.recentActivity && typedStats.recentActivity.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedStats.recentActivity.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-sm">{log.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(log.createdAt), "MMM d, h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-10 w-10 mx-auto mb-3 opacity-15" />
              <p className="font-medium text-sm">No activity yet</p>
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
