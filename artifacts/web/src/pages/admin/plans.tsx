import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Star, Zap, TrendingUp, Building2, Globe, Package } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Plan {
  id: number;
  name: string;
  period: string;
  price: number;
  currency: string;
  otpLimit: number;
  features: string[];
  popular: boolean;
  active: boolean;
  allowCustomNumber: boolean;
  allowUsaNumbers: boolean;
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  Free: Package,
  Starter: Zap,
  Growth: TrendingUp,
  Business: Building2,
  Enterprise: Globe,
};

const PLAN_COLORS: Record<string, string> = {
  Free: "from-gray-50 to-gray-100 border-gray-200",
  Starter: "from-blue-50 to-blue-100 border-blue-200",
  Growth: "from-emerald-50 to-emerald-100 border-emerald-200",
  Business: "from-violet-50 to-violet-100 border-violet-200",
  Enterprise: "from-amber-50 to-amber-100 border-amber-200",
};

const PLAN_ICON_COLORS: Record<string, string> = {
  Free: "text-gray-500",
  Starter: "text-blue-500",
  Growth: "text-emerald-500",
  Business: "text-violet-500",
  Enterprise: "text-amber-500",
};

function EditPlanDialog({
  plan,
  open,
  onOpenChange,
  onSuccess,
}: {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [price, setPrice] = useState("");
  const [otpLimit, setOtpLimit] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const token = localStorage.getItem("whatotp_token");

  const handleOpen = (v: boolean) => {
    if (v && plan) {
      setPrice(String(plan.price));
      setOtpLimit(String(plan.otpLimit));
      setFeaturesText((plan.features ?? []).join("\n"));
    }
    onOpenChange(v);
  };

  const save = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const features = featuresText.split("\n").map(f => f.trim()).filter(Boolean);
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          price: parseFloat(price),
          otpLimit: parseInt(otpLimit),
          features,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Plan Updated", description: `${plan.name} plan has been updated.` });
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Could not update plan." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {plan?.name} Plan</DialogTitle>
          <DialogDescription>Update pricing, OTP quota, and feature list.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">Price (NGN/month)</Label>
              <Input
                id="plan-price"
                type="number"
                min={0}
                step={500}
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 7500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-otp">OTP Limit / month</Label>
              <Input
                id="plan-otp"
                type="number"
                min={1}
                value={otpLimit}
                onChange={e => setOtpLimit(e.target.value)}
                placeholder="e.g. 2000"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-features">Features (one per line)</Label>
            <textarea
              id="plan-features"
              rows={5}
              value={featuresText}
              onChange={e => setFeaturesText(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              placeholder="500 OTPs per month&#10;No branding on messages&#10;Email support"
            />
            <p className="text-xs text-muted-foreground">Each line becomes one feature bullet point.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("whatotp_token");
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-plans"] });

  const toggleField = async (plan: Plan, field: "active" | "popular") => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: !plan[field] }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({
        title: "Plan Updated",
        description: `${plan.name} ${field} set to ${!plan[field]}.`,
      });
      refresh();
    } catch {
      toast({ variant: "destructive", title: "Failed", description: `Could not update ${field}.` });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing Plans</h1>
        <p className="text-muted-foreground mt-1">Edit plan prices, OTP quotas, and features shown to customers.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans?.map(plan => {
            const Icon = PLAN_ICONS[plan.name] ?? Package;
            const gradClass = PLAN_COLORS[plan.name] ?? "from-gray-50 to-gray-100 border-gray-200";
            const iconClass = PLAN_ICON_COLORS[plan.name] ?? "text-gray-500";
            return (
              <Card key={plan.id} className={`relative border bg-gradient-to-br ${gradClass} ${!plan.active ? "opacity-60" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white flex items-center gap-1 px-3 py-0.5 shadow-sm">
                      <Star className="h-3 w-3 fill-current" /> Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3 pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-white/70 p-2 shadow-sm">
                        <Icon className={`h-5 w-5 ${iconClass}`} />
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full bg-white/60 hover:bg-white"
                      onClick={() => setEditPlan(plan)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString("en-NG")}`}
                    </span>
                    {plan.price > 0 && <span className="text-sm text-muted-foreground ml-1">/month</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-white/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">OTP Quota</p>
                    <p className="font-bold text-gray-900">{plan.otpLimit.toLocaleString()} / month</p>
                  </div>

                  <div className="space-y-1.5">
                    {(plan.features ?? []).slice(0, 4).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                    {(plan.features ?? []).length > 4 && (
                      <p className="text-xs text-muted-foreground pl-5">+{plan.features.length - 4} more features</p>
                    )}
                  </div>

                  <div className="border-t border-white/60 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-gray-600 cursor-pointer">Active (visible to users)</Label>
                      <Switch
                        checked={plan.active}
                        onCheckedChange={() => toggleField(plan, "active")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-gray-600 cursor-pointer">Mark as Popular</Label>
                      <Switch
                        checked={plan.popular}
                        onCheckedChange={() => toggleField(plan, "popular")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EditPlanDialog
        plan={editPlan}
        open={!!editPlan}
        onOpenChange={v => !v && setEditPlan(null)}
        onSuccess={refresh}
      />
    </div>
  );
}
