import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  useGetCurrentSubscription,
  getGetCurrentSubscriptionQueryKey,
  useListPlans,
  useInitializePayment,
  useCancelSubscription,
  verifyPayment,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, CreditCard, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Subscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [subscribingPlanId, setSubscribingPlanId] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  const { data: sub, isLoading: subLoading } = useGetCurrentSubscription();
  const { data: plans, isLoading: plansLoading } = useListPlans();

  const initPaymentMutation = useInitializePayment();
  const cancelMutation = useCancelSubscription();

  // Handle Paystack redirect callback — detect ?paystack_ref=... in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("paystack_ref");
    if (!ref) return;

    // Clean the URL immediately
    window.history.replaceState({}, "", window.location.pathname);

    setVerifying(true);
    verifyPayment(ref)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSubscriptionQueryKey() });
        toast({ title: "Payment Successful!", description: "Your subscription is now active." });
      })
      .catch((e: any) => {
        toast({ variant: "destructive", title: "Payment Verification Failed", description: e?.message || "Please contact support." });
      })
      .finally(() => setVerifying(false));
  }, []);

  const handleSubscribe = async (planId: number) => {
    setSubscribingPlanId(planId);
    try {
      const result = await initPaymentMutation.mutateAsync({ data: { planId } });
      // Redirect to Paystack payment page
      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could Not Initialize Payment",
        description: error?.message || "Please try again later.",
      });
      setSubscribingPlanId(null);
    }
  };

  const handleCancel = async () => {
    if (!sub?.id) return;
    try {
      await cancelMutation.mutateAsync({ id: sub.id });
      queryClient.invalidateQueries({ queryKey: getGetCurrentSubscriptionQueryKey() });
      toast({ title: "Subscription Cancelled", description: "Your plan will remain active until the period ends." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Cancellation Failed", description: error?.message || "Please try again later." });
    }
  };

  const currentPlan = plans?.find(p => p.id === sub?.planId);
  const otpUsed = sub?.otpUsed || 0;
  const otpLimit = currentPlan?.otpLimit || 100;
  const usagePercentage = Math.min(100, Math.round((otpUsed / otpLimit) * 100));

  const monthlyPlans = plans?.filter(p => p.period === "monthly") || [];

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium">Verifying your payment...</p>
        <p className="text-muted-foreground text-sm">Please wait while we confirm your transaction.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your billing plan and usage limits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            {subLoading || plansLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : sub && currentPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                    <p className="text-muted-foreground">
                      ₦{currentPlan.price.toLocaleString("en-NG")}/{currentPlan.period.replace("ly", "")}
                    </p>
                  </div>
                  <Badge variant={sub.status === "active" ? "default" : "secondary"} className={sub.status === "active" ? "bg-primary" : ""}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </Badge>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Usage ({usagePercentage}%)</span>
                    <span className="font-medium">{otpUsed.toLocaleString()} / {otpLimit.toLocaleString()} OTPs</span>
                  </div>
                  <Progress value={usagePercentage} className={usagePercentage > 90 ? "bg-destructive/20 [&>div]:bg-destructive" : ""} />
                  {usagePercentage > 90 && (
                    <p className="text-xs text-destructive mt-2 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      You are approaching your limit
                    </p>
                  )}
                </div>

                <div className="text-sm text-muted-foreground pt-2">
                  Current period ends on {format(new Date(sub.endDate), "MMMM d, yyyy")}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p>No active subscription</p>
                <p className="text-xs mt-1">Choose a plan below to get started</p>
              </div>
            )}
          </CardContent>
          {sub?.status === "active" && (
            <CardFooter className="border-t bg-muted/50 px-6 py-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your plan will remain active until {format(new Date(sub.endDate), "MMMM d, yyyy")}. You can resubscribe at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Confirm Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          )}
        </Card>
      </div>

      <div className="pt-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Available Plans</h2>
            <p className="text-muted-foreground">All prices in Nigerian Naira (NGN) · Monthly billing · Powered by Paystack</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plansLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="flex flex-col">
                  <CardHeader><Skeleton className="h-6 w-24 mb-2" /><Skeleton className="h-4 w-32" /></CardHeader>
                  <CardContent className="flex-1"><Skeleton className="h-10 w-24 mb-6" /><Skeleton className="h-32 w-full" /></CardContent>
                </Card>
              ))}
            </>
          ) : (
            monthlyPlans.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isLoading = subscribingPlanId === plan.id && initPaymentMutation.isPending;

              return (
                <Card key={plan.id} className={`flex flex-col ${plan.popular ? "border-primary shadow-md ring-1 ring-primary/30" : ""}`}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.popular && <Badge variant="default" className="bg-primary">Popular</Badge>}
                    </div>
                    <CardDescription>{plan.otpLimit.toLocaleString()} OTPs/month</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-baseline text-3xl font-bold mb-2">
                      ₦{plan.price.toLocaleString("en-NG")}
                      <span className="text-sm font-medium text-muted-foreground ml-1">/mo</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(plan as any).allowCustomNumber && (
                        <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">Custom Number</Badge>
                      )}
                      {(plan as any).allowUsaNumbers && (
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">🇺🇸 USA Numbers</Badge>
                      )}
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={initPaymentMutation.isPending}
                        data-testid={`button-subscribe-${plan.id}`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecting...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Pay with Paystack
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
