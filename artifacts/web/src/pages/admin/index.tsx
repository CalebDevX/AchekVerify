import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Phone, Send, TrendingUp, Activity, ArrowRight, BarChart3, Shield } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { format } from "date-fns";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64"><Skeleton className="h-8 w-full" /></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const COLORS = [
    "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  ];

  const revenue = stats?.revenue ?? 0;
  const revenueNGN = typeof revenue === "number" ? revenue : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time metrics across all users and system components.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          System Online
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/60 border-blue-200 col-span-1">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Users</p>
              <div className="rounded-lg bg-blue-500/10 p-1.5">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-900 mt-2">{(stats?.totalUsers ?? 0).toLocaleString()}</p>
            <Link href="/admin/users">
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 cursor-pointer hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-200 col-span-1">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Active Subs</p>
              <div className="rounded-lg bg-emerald-500/10 p-1.5">
                <Activity className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-900 mt-2">{(stats?.activeSubscriptions ?? 0).toLocaleString()}</p>
            <p className="text-xs text-emerald-600 mt-1">Paying subscribers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100/60 border-violet-200 col-span-1">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Monthly Revenue</p>
              <div className="rounded-lg bg-violet-500/10 p-1.5">
                <TrendingUp className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-violet-900 mt-2">
              ₦{revenueNGN.toLocaleString("en-NG")}
            </p>
            <Link href="/admin/plans">
              <p className="text-xs text-violet-600 mt-1 flex items-center gap-1 cursor-pointer hover:underline">
                Edit pricing <ArrowRight className="h-3 w-3" />
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-200 col-span-1">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">OTPs Sent</p>
              <div className="rounded-lg bg-amber-500/10 p-1.5">
                <Send className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-900 mt-2">{(stats?.totalOtpSent ?? 0).toLocaleString()}</p>
            <Link href="/admin/otp-logs">
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 cursor-pointer hover:underline">
                View logs <ArrowRight className="h-3 w-3" />
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/60 border-rose-200 col-span-1">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Numbers Online</p>
              <div className="rounded-lg bg-rose-500/10 p-1.5">
                <Phone className="h-4 w-4 text-rose-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-rose-900 mt-2">{(stats?.connectedNumbers ?? 0).toLocaleString()}</p>
            <Link href="/admin/numbers">
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 cursor-pointer hover:underline">
                Manage <ArrowRight className="h-3 w-3" />
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Recent Signups
              </CardTitle>
              <CardDescription>The newest users on the platform</CardDescription>
            </div>
            <Link href="/admin/users">
              <Button size="sm" variant="outline" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "destructive" : "secondary"} className="text-xs">
                          {user.role ?? "user"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No users yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> OTP by Country
            </CardTitle>
            <CardDescription>Traffic distribution by destination</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.otpByCountry && stats.otpByCountry.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.otpByCountry}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="country"
                      >
                        {stats.otpByCountry.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, _name, props) => [`${value} OTPs`, props.payload.country?.toUpperCase()]}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {stats.otpByCountry.map((item, index) => (
                    <div key={item.country} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-muted-foreground uppercase text-xs font-medium">{item.country}</span>
                      </div>
                      <span className="font-semibold text-xs">{item.count.toLocaleString()} OTPs</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-[220px] items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No OTP data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/users">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-100 hover:border-blue-300">
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Manage Users</p>
                <p className="text-xs text-muted-foreground">Edit, suspend, delete accounts</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/plans">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-violet-100 hover:border-violet-300">
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="rounded-xl bg-violet-100 p-3">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Edit Pricing</p>
                <p className="text-xs text-muted-foreground">Update plan prices & quotas</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/numbers">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-emerald-100 hover:border-emerald-300">
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="rounded-xl bg-emerald-100 p-3">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">WhatsApp Numbers</p>
                <p className="text-xs text-muted-foreground">Manage sending pool</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
