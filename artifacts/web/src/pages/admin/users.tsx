import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Shield, ShieldAlert, MoreHorizontal, CreditCard, Loader2 } from "lucide-react";
import {
  useListUsers,
  getListUsersQueryKey,
  useSuspendUser,
  useListPlans,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  createdAt: string;
  otpCount?: number;
  subscription?: {
    status: string;
    plan?: { id: number; name: string; price: number; otpLimit: number };
  };
}

function AssignPlanDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("whatotp_token");

  const monthlyPlans = plans?.filter((p) => p.period === "monthly") ?? [];

  const assign = async (planId: number, planName: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/assign-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Plan Updated", description: `${user.name} is now on the ${planName} plan.` });
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Could not update plan." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Plan — {user?.name}</DialogTitle>
          <DialogDescription>
            Select a plan to assign. This will immediately replace any existing subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {plansLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            monthlyPlans.map((plan) => {
              const isCurrent = user?.subscription?.plan?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  disabled={loading || isCurrent}
                  onClick={() => assign(plan.id, plan.name)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all disabled:opacity-60 ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {plan.name}
                      {isCurrent && (
                        <span className="ml-2 text-xs text-emerald-600 font-normal">Current plan</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plan.otpLimit.toLocaleString()} OTPs/month ·{" "}
                      {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString("en-NG")}/mo`}
                    </p>
                  </div>
                  {loading && !isCurrent && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                </button>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [planDialogUser, setPlanDialogUser] = useState<UserRow | null>(null);

  const { data: users, isLoading } = useListUsers({ limit: 100 });
  const suspendMutation = useSuspendUser();

  const handleToggleSuspend = async (id: number) => {
    try {
      await suspendMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User Status Updated", description: "Suspension status toggled." });
    } catch {
      toast({ variant: "destructive", title: "Action Failed", description: "Please try again later." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage customer accounts, plans, and subscriptions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>All registered developers and businesses on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Total OTPs</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as UserRow[]).map((user) => (
                  <TableRow key={user.id} className={user.suspended ? "opacity-60 bg-muted/50" : ""}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscription?.plan ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{user.subscription.plan.name}</span>
                          <span
                            className={
                              user.subscription.status === "active"
                                ? "text-primary text-xs"
                                : "text-muted-foreground text-xs"
                            }
                          >
                            {user.subscription.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No plan</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-sm">
                      {user.otpCount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {user.suspended ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> Suspended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex w-fit items-center gap-1">
                          <Shield className="h-3 w-3" /> Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => setPlanDialogUser(user)}
                          >
                            <CreditCard className="h-4 w-4" />
                            Change Plan
                          </DropdownMenuItem>
                          {user.role !== "admin" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={user.suspended ? "text-primary" : "text-destructive"}
                                onClick={() => handleToggleSuspend(user.id)}
                              >
                                {user.suspended ? "Restore Access" : "Suspend Account"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">No users found.</div>
          )}
        </CardContent>
      </Card>

      <AssignPlanDialog
        user={planDialogUser}
        open={!!planDialogUser}
        onOpenChange={(v) => !v && setPlanDialogUser(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })}
      />
    </div>
  );
}
