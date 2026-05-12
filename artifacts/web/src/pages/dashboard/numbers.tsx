import { useGetCurrentSubscription } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, CheckCircle2, XCircle, Wifi, WifiOff, 
  ArrowRight, Users, Lock, Info, ShieldCheck
} from "lucide-react";
import { Link } from "wouter";

const POOL_PLANS = ["Free", "Starter", "Growth"];
const DEDICATED_PLANS = ["Business", "Enterprise"];

function PlanBadge({ name }: { name: string }) {
  const color = DEDICATED_PLANS.includes(name)
    ? "bg-purple-100 text-purple-800 border-purple-200"
    : "bg-emerald-100 text-emerald-800 border-emerald-200";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>{name}</span>;
}

export default function Numbers() {
  const { data: sub, isLoading } = useGetCurrentSubscription();
  const plan = (sub as any)?.plan;
  const planName: string = plan?.name || "Free";

  const isPoolPlan = POOL_PLANS.includes(planName);
  const isDedicatedPlan = DEDICATED_PLANS.includes(planName);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sender Numbers</h1>
        <p className="text-muted-foreground mt-1">
          WhatsApp numbers used to deliver your OTP messages.
        </p>
      </div>

      {/* Plan badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Your plan:</span>
        {isLoading ? (
          <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
        ) : (
          <PlanBadge name={planName} />
        )}
      </div>

      {/* How it works card */}
      <Card className="border-blue-100 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" /> How sender numbers work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex gap-3">
              <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">Shared Pool (Free · Starter · Growth)</p>
                <p className="text-blue-700/80 text-xs mt-0.5">
                  OTPs are sent from AchekOTP's shared number pool. Numbers are auto-selected 
                  based on availability. Pool numbers are maintained by the AchekOTP team — 
                  nothing to configure on your end.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-800">Dedicated Number (Business · Enterprise)</p>
                <p className="text-purple-700/80 text-xs mt-0.5">
                  Your OTPs go out from a number exclusively assigned to your account. 
                  Contact support to link your own WhatsApp number and our team will 
                  set it up within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared pool numbers (all plans) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-emerald-500" />
            Shared Sender Pool
          </CardTitle>
          <CardDescription>
            Available for all plans. Your OTPs are automatically routed through these numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Static representation of the pool — real status is managed by admin */}
          {[
            { display: "+234 XXX XXXX XXX", label: "Pool Number 1", active: true },
            { display: "+234 XXX XXXX XXX", label: "Pool Number 2", active: true },
          ].map((num, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-mono text-sm font-medium">{num.display}</p>
                  <p className="text-xs text-muted-foreground">{num.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {num.active
                  ? <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">Active</Badge></>
                  : <><WifiOff className="h-4 w-4 text-muted-foreground" /><Badge variant="outline" className="text-xs">Offline</Badge></>
                }
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            Exact numbers are managed by the AchekOTP admin team. Pool health is monitored 24/7.
          </p>
        </CardContent>
      </Card>

      {/* Dedicated number — locked for pool plans */}
      <Card className={isPoolPlan ? "opacity-80" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-500" />
            Your Dedicated Number
            {isPoolPlan && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-xs font-normal">
                Business+ only
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            A WhatsApp number exclusively assigned to your account for all OTP delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPoolPlan ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-purple-800 text-sm">Unlock a dedicated sender number</p>
                  <p className="text-purple-700/80 text-xs mt-0.5">
                    Business and Enterprise plans include a WhatsApp number exclusively tied to your brand.
                    Recipients see your number — not a shared pool — boosting trust and delivery rates.
                  </p>
                  <ul className="mt-2 space-y-0.5 text-xs text-purple-700">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-purple-500" /> No number sharing with other accounts</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-purple-500" /> Custom display name on WhatsApp</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-purple-500" /> Higher daily sending limits</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-purple-500" /> Custom message templates ({'{{name}}'}, etc.)</li>
                  </ul>
                </div>
              </div>
              <Link href="/dashboard/subscription">
                <Button className="bg-purple-700 hover:bg-purple-800 text-white flex-shrink-0" size="sm">
                  Upgrade to Business <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                <Smartphone className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Dedicated number request</p>
                  <p className="text-xs text-muted-foreground">Contact support to link your WhatsApp number to your account.</p>
                </div>
                <Badge className="ml-auto bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs">Pending setup</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                To get started, email <a href="mailto:support@achek.com.ng" className="underline text-purple-700">support@achek.com.ng</a> with 
                your account email and the WhatsApp number you'd like to link. Setup takes up to 24 hours.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom templates info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Message Templates</CardTitle>
          <CardDescription>Personalize the OTP message your users receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-950 p-4">
            <p className="text-xs text-gray-500 mb-2 font-mono">POST /api/otp/send</p>
            <pre className="text-[12px] font-mono text-gray-200 overflow-x-auto">{`{
  "phoneNumber": "+2348012345678",
  "template": "Hi {{name}}, your {{company}} code is {{code}}. Valid 10 min.",
  "recipientName": "Ada",
  "companyName": "MyApp"
}`}</pre>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {[
              { variable: "{{code}}", desc: "The generated OTP code (required in every template)" },
              { variable: "{{name}}", desc: "Recipient name — pass as recipientName in the request body" },
              { variable: "{{company}}", desc: "Your brand name — pass as companyName in the request body" },
            ].map(({ variable, desc }) => (
              <div key={variable} className="rounded-lg border p-3 bg-muted/20">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-emerald-700">{variable}</code>
                <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
              </div>
            ))}
          </div>
          {isPoolPlan && planName !== "Growth" && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
              <Lock className="h-3.5 w-3.5 flex-shrink-0" />
              Custom templates are available on <strong>Growth, Business, and Enterprise</strong> plans.
              <Link href="/dashboard/subscription">
                <span className="underline cursor-pointer ml-1">Upgrade →</span>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
