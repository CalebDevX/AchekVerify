import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Shield, ShieldAlert, MoreHorizontal, CreditCard, Loader2, Trash2, ShieldCheck, ShieldX, Pencil, Search, UserCheck } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function EditUserDialog({
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
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const token = localStorage.getItem("whatotp_token");

  const handleOpen = (v: boolean) => {
    if (v && user) {
      setName(user.name);
      setEmail(user.email);
    }
    onOpenChange(v);
  };

  const save = async () => {
    if (!user) return;
    if (!name.trim() && !email.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name or email is required." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }
      toast({ title: "User Updated", description: `${name} has been updated successfully.` });
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message || "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Edit User
          </DialogTitle>
          <DialogDescription>Update name and email for this account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alice Okafor"
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. alice@example.com"
              disabled={saving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
                      {isCurrent && <span className="ml-2 text-xs text-emerald-600 font-normal">Current plan</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plan.otpLimit.toLocaleString()} OTPs/month ·{" "}
                      {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString("en-NG")}/mo`}
                    </p>
                  </div>
                  {loading && !isCurrent && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </button>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({
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
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("whatotp_token");

  const changeRole = async (role: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Role Updated", description: `${user.name} is now a ${role}.` });
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Could not update role." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Role — {user?.name}</DialogTitle>
          <DialogDescription>Select a new role for this user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {["user", "admin"].map((role) => {
            const isCurrent = user?.role === role;
            return (
              <button
                key={role}
                disabled={loading || isCurrent}
                onClick={() => changeRole(role)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all disabled:opacity-60 capitalize ${
                  isCurrent ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50"
                }`}
              >
                {role === "admin" ? <ShieldCheck className="h-4 w-4 text-red-500" /> : <Shield className="h-4 w-4 text-blue-500" />}
                <div>
                  <p className="font-semibold text-sm capitalize">{role} {isCurrent && <span className="text-xs text-emerald-600 font-normal ml-1">Current</span>}</p>
                  <p className="text-xs text-gray-500">{role === "admin" ? "Full access to admin panel" : "Standard account access"}</p>
                </div>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [planDialogUser, setPlanDialogUser] = useState<UserRow | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<UserRow | null>(null);
  const [editDialogUser, setEditDialogUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: users, isLoading } = useListUsers({ limit: 100 });
  const suspendMutation = useSuspendUser();
  const token = localStorage.getItem("whatotp_token");

  const handleToggleSuspend = async (id: number) => {
    try {
      await suspendMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User Status Updated", description: "Suspension status toggled." });
    } catch {
      toast({ variant: "destructive", title: "Action Failed", description: "Please try again later." });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User Deleted", description: `${deleteUser.email} has been permanently removed.` });
      setDeleteUser(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message || "Please try again." });
    } finally {
      setDeleting(false);
    }
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const filteredUsers = (users as UserRow[] | undefined)?.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  }) ?? [];

  const totalUsers = (users as UserRow[] | undefined)?.length ?? 0;
  const activeUsers = (users as UserRow[] | undefined)?.filter(u => !u.suspended).length ?? 0;
  const adminUsers = (users as UserRow[] | undefined)?.filter(u => u.role === "admin").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage customer accounts, plans, subscriptions, and roles.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Users</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Active Accounts</p>
            <p className="text-3xl font-bold text-emerald-900 mt-1">{activeUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Admin Accounts</p>
            <p className="text-3xl font-bold text-red-900 mt-1">{adminUsers}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>All registered developers and businesses on the platform.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.suspended ? "opacity-60 bg-muted/30" : "hover:bg-muted/20"}>
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
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscription?.plan ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{user.subscription.plan.name}</span>
                          <span className={`text-xs ${user.subscription.status === "active" ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {user.subscription.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No plan</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-sm">
                      {(user.otpCount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {user.suspended ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1 text-xs">
                          <ShieldAlert className="h-3 w-3" /> Suspended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex w-fit items-center gap-1 text-xs">
                          <UserCheck className="h-3 w-3" /> Active
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
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => setEditDialogUser(user)}>
                            <Pencil className="h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => setPlanDialogUser(user)}>
                            <CreditCard className="h-4 w-4" /> Change Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => setRoleDialogUser(user)}>
                            {user.role === "admin" ? <ShieldX className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                            Change Role
                          </DropdownMenuItem>
                          {user.role !== "admin" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={user.suspended ? "text-primary" : "text-orange-600"}
                                onClick={() => handleToggleSuspend(user.id)}
                              >
                                {user.suspended ? "Restore Access" : "Suspend Account"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive flex items-center gap-2"
                                onClick={() => setDeleteUser(user)}
                              >
                                <Trash2 className="h-4 w-4" /> Delete User
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
            <div className="text-center py-16 text-muted-foreground">
              {search ? `No users matching "${search}"` : "No users found."}
            </div>
          )}
        </CardContent>
      </Card>

      <EditUserDialog user={editDialogUser} open={!!editDialogUser} onOpenChange={v => !v && setEditDialogUser(null)} onSuccess={refresh} />
      <AssignPlanDialog user={planDialogUser} open={!!planDialogUser} onOpenChange={(v) => !v && setPlanDialogUser(null)} onSuccess={refresh} />
      <ChangeRoleDialog user={roleDialogUser} open={!!roleDialogUser} onOpenChange={(v) => !v && setRoleDialogUser(null)} onSuccess={refresh} />

      <AlertDialog open={!!deleteUser} onOpenChange={(v) => !v && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Permanently Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteUser?.name}</strong> ({deleteUser?.email}) and all their data —
              subscriptions, API keys, WhatsApp numbers, and OTP logs. <br /><br />
              <span className="font-semibold text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting...</> : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
