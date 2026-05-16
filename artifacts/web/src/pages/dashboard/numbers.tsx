import { useQuery } from "@tanstack/react-query";
import { useGetCurrentSubscription } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, CheckCircle2, WifiOff, Wifi,
  ArrowRight, Users, Lock, Info, ShieldCheck, RefreshCw,
} from "lucide-react";
import { Link } from "wouter";

const BASE_URL = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}/api`
  : "/api";

const POOL_PLANS = ["Free", "Starter", "Growth"];
const DEDICATED_PLANS = ["Business", "Enterprise"];

type PoolNumber = {
  id: number;
  label: string;
  country: string;
  status: string;
  connected: boolean;
  otpSentCount: number;
};

type UserNumber = {
  id: number;
  phoneNumber: string;
  label: string;
  country: string;
  status: string;
  sessionActive: boolean;
  otpSentCount: number;
};

const COUNTRY_FLAG: Record<string, string> = {
  ng: "🇳🇬", us: "🇺🇸", uk: "🇬🇧", gh: "🇬🇭",
  za: "🇿🇦", ke: "🇰🇪", eg: "🇪🇬", in: "🇮🇳", au: "🇦🇺", ca: "🇨🇦",
};

async function fetchPool(): Promise<PoolNumber[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/whatsapp-numbers/pool`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchUserNumbers(): Promise<UserNumber[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/whatsapp-numbers`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  return res.json();
}

function StatusBadge({ connected, status }: { connected: boolean; status: string }) {
  if (connected) {
    return (
      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </Badge>
    );
  }
  if (status === "connecting") {
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        Connecting
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Offline
    </Badge>
  );
}

export default function Numbers() {
  const { data: sub, isLoading: subLoading } = useGetCurrentSubscription();
  const plan = (sub as any)?.plan;
  const planName: string = plan?.name || "Free";

  const isPoolPlan = POOL_PLANS.includes(planName);

  const { data: poolNumbers = [], isLoading: poolLoading, refetch: refetchPool } = useQuery({
    queryKey: ["pool-numbers"],
    queryFn: fetchPool,
    refetchInterval: 15000,
  });

  const { data: userNumbers = [], isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ["user-whatsapp-numbers"],
    queryFn: fetchUserNumbers,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sender Numbers</h1>
          <p className="text-muted-foreground mt-1">WhatsApp numbers used to deliver your OTP messages.</p>
        </div>
        <div className="flex items-center gap-2">
          {subLoading ? (
            <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
          ) : (
            <Badge className={
              DEDICATED_PLANS.includes(planName)
                ? "bg-purple-100 text-purple-800 border border-purple-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }>{planName} plan</Badge>
          )}
          <Button variant="ghost" size="icon" onClick={() => { refetchPool(); refetchUser(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* How it works */}
      <Card className="border-blue-100 bg-blue-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" /> How sender numbers work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex gap-3">
              <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">Shared Pool — Free · Starter · Growth</p>
                <p className="text-xs text-blue-700/80 mt-0.5">
                  OTPs are sent automatically from AchekOTP's shared number pool.
                  Numbers are load-balanced and monitored 24/7 by our team.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-800">Dedicated Number — Business · Enterprise</p>
                <p className="text-xs text-purple-700/80 mt-0.5">
                  A WhatsApp number exclusively assigned to your brand. Customers always
                  see YOUR number. Also powers the AI WhatsApp Bot.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared pool (live data) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="h-4 w-4 text-emerald-500" /> Shared Sender Pool
              </CardTitle>
              <CardDescription className="mt-0.5">
                OTPs are automatically routed through these numbers for your plan.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {poolNumbers.filter(n => n.connected).length}/{poolNumbers.length} live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {poolLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : poolNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
              <WifiOff className="h-6 w-6 mx-auto mb-2 opacity-40" />
              No pool numbers connected yet. The admin team is setting them up.
            </div>
          ) : (
            <div className="space-y-2">
              {poolNumbers.map(num => (
                <div key={num.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
                      {COUNTRY_FLAG[num.country] || "📱"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{num.label}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{num.country} · {num.otpSentCount.toLocaleString()} OTPs sent</p>
                    </div>
                  </div>
                  <StatusBadge connected={num.connected} status={num.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dedicated / User numbers */}
      <Card className={isPoolPlan ? "opacity-80" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-purple-500" />
                Your Dedicated Numbers
                {isPoolPlan && (
                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-xs font-normal">Business+</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-0.5">
                WhatsApp numbers exclusively assigned to your account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPoolPlan ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-purple-800 text-sm">Unlock a dedicated sender number</p>
                  <p className="text-purple-700/80 text-xs mt-0.5">
                    Business and Enterprise plans include a WhatsApp number exclusively tied to your brand — plus full AI bot support.
                  </p>
                  <ul className="mt-2 space-y-0.5 text-xs text-purple-700">
                    {["No sharing — your number only", "Custom WhatsApp display name", "AI-powered WhatsApp chatbot", "Higher daily send limits"].map(f => (
                      <li key={f} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-purple-500" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Link href="/dashboard/subscription">
                <Button className="bg-purple-700 hover:bg-purple-800 text-white flex-shrink-0" size="sm">
                  Upgrade to Business <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          ) : userLoading ? (
            <div className="space-y-2">
              {[1].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : userNumbers.length === 0 ? (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                <Smartphone className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">No dedicated number linked yet</p>
                  <p className="text-xs text-muted-foreground">Email support to link your WhatsApp number. Setup takes up to 24 hours.</p>
                </div>
                <Badge className="ml-auto bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs">Pending</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Email <a href="mailto:support@achek.com.ng" className="underline text-purple-700">support@achek.com.ng</a> with
                your account email and the WhatsApp number you'd like to link.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {userNumbers.map(num => (
                <div key={num.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                      {COUNTRY_FLAG[num.country] || "📱"}
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium">{num.phoneNumber}</p>
                      <p className="text-xs text-muted-foreground">{num.label} · {num.otpSentCount.toLocaleString()} OTPs sent</p>
                    </div>
                  </div>
                  <StatusBadge connected={num.sessionActive} status={num.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Custom Message Templates</CardTitle>
          <CardDescription>Available on Growth, Business, and Enterprise plans.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-950 p-4">
            <p className="text-xs text-gray-500 mb-2 font-mono">POST /api/otp/send — Growth+ only</p>
            <pre className="text-[12px] font-mono text-gray-200 overflow-x-auto leading-relaxed">{`{
  "phoneNumber": "+2348012345678",
  "template": "Hi {{name}}, your {{company}} code is {{code}}. Valid 10 min.",
  "recipientName": "Ada",
  "companyName": "MyApp"
}`}</pre>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { v: "{{code}}", d: "The generated OTP (required in every template)" },
              { v: "{{name}}", d: "Recipient name — send as recipientName in body" },
              { v: "{{company}}", d: "Brand name — send as companyName in body" },
            ].map(({ v, d }) => (
              <div key={v} className="rounded-lg border p-3 bg-muted/20">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-emerald-700">{v}</code>
                <p className="text-xs text-muted-foreground mt-1.5">{d}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
