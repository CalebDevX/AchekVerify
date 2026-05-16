import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Bot, Zap, Key, MessageSquare, Settings2, Save, Send, RefreshCw,
  Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, Users, ShoppingCart,
  HelpCircle, ArrowRight, Clock, Globe, Webhook, UserCheck, Megaphone,
  Inbox, Trash2, Reply, Radio, Plus, Upload, ChevronRight, BarChart3,
  Phone, PhoneCall
} from "lucide-react";
import { useGetCurrentSubscription } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";

const BASE_URL = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}/api`
  : "/api";

function getToken() { return localStorage.getItem("token") || ""; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error || `Request failed: ${res.status}`);
  }
  return res.json();
}

const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini — Fast, affordable" },
  { value: "gpt-4o", label: "GPT-4o — Most capable" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo — Budget" },
];

const GEMINI_MODELS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash — Latest & fast" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash — Free tier" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro — Smarter" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ha", label: "Hausa (هَوْسَ)" },
  { value: "yo", label: "Yoruba" },
  { value: "ig", label: "Igbo" },
  { value: "pcm", label: "Nigerian Pidgin" },
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
];

const TIMEZONES = [
  "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg",
  "Africa/Cairo", "Europe/London", "America/New_York", "Asia/Dubai",
];

const SYSTEM_PRESETS = [
  {
    id: "customer_support",
    label: "Customer Support",
    prompt: `You are a professional customer support agent. Help customers with their questions, resolve complaints efficiently, and escalate complex issues when needed. Always be friendly, concise, and solution-focused. If you cannot help, direct them to email support.`,
  },
  {
    id: "sales",
    label: "Sales Agent",
    prompt: `You are a knowledgeable sales assistant. Help potential customers understand products and pricing, answer questions, overcome objections, and guide them toward making a purchase. Be enthusiastic but honest. Qualify leads by asking about their needs.`,
  },
  {
    id: "faq",
    label: "FAQ Bot",
    prompt: `You are a concise FAQ bot. Answer common questions clearly and briefly. If a question falls outside your knowledge, say "I don't have that information right now — please contact our team." Keep all answers under 3 sentences.`,
  },
  {
    id: "appointment",
    label: "Appointment Booking",
    prompt: `You are an appointment scheduling assistant. Help customers book, reschedule, or cancel appointments. Collect their name, phone number, preferred date/time, and service needed. Confirm all details clearly before finalizing.`,
  },
  {
    id: "ecommerce",
    label: "E-commerce Support",
    prompt: `You are an e-commerce support agent. Help customers with orders, tracking, returns, refunds, and product questions. Always ask for the order number when dealing with order issues. Be empathetic with complaints and offer solutions promptly.`,
  },
];

const FEATURES = [
  { id: "otp_help", label: "OTP Assistance", icon: Key, desc: "Help customers with OTP codes" },
  { id: "faq", label: "FAQ Answering", icon: HelpCircle, desc: "Answer common questions" },
  { id: "lead_capture", label: "Lead Capture", icon: Users, desc: "Collect name, email, phone" },
  { id: "order_tracking", label: "Order Tracking", icon: ShoppingCart, desc: "Help track orders" },
  { id: "appointment", label: "Appointment Booking", icon: Clock, desc: "Schedule appointments" },
  { id: "human_handoff", label: "Human Handoff", icon: UserCheck, desc: "Escalate to human agent" },
];

type ChatMsg = { role: "user" | "bot"; text: string; loading?: boolean };
type Session = { phone: string; lastMessage: string; lastMessageAt: string; lastRole: string };
type ConvMsg = { id: number; role: string; content: string; createdAt: string };

type BotConfig = {
  enabled: boolean; provider: string; model: string; botName: string;
  systemPrompt: string; welcomeMessage: string; fallbackMessage: string;
  features: string[]; maxTokens: number; hasApiKey: boolean; totalMessages: number;
  webhookUrl: string; language: string; businessHoursEnabled: boolean;
  businessHoursStart: string; businessHoursEnd: string; businessHoursTimezone: string;
  outsideHoursMessage: string; handoffKeyword: string; handoffMessage: string;
  responseDelayMs: number; typingIndicatorEnabled: boolean;
};

const DEFAULTS: BotConfig = {
  enabled: false, provider: "openai", model: "gpt-4o-mini",
  botName: "AchekBot", systemPrompt: SYSTEM_PRESETS[0].prompt,
  welcomeMessage: "Hi! 👋 How can I help you today?",
  fallbackMessage: "Sorry, I'm having trouble. Please try again or contact our support.",
  features: ["otp_help", "faq"], maxTokens: 500, hasApiKey: false, totalMessages: 0,
  webhookUrl: "", language: "en", businessHoursEnabled: false,
  businessHoursStart: "09:00", businessHoursEnd: "17:00",
  businessHoursTimezone: "Africa/Lagos", outsideHoursMessage: "",
  handoffKeyword: "", handoffMessage: "Connecting you to a human agent. Please wait...",
  responseDelayMs: 1500, typingIndicatorEnabled: true,
};

function UpsellGate() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-7 w-7 text-purple-600" /> WhatsApp AI Bot
        </h1>
        <p className="text-muted-foreground mt-1">Automate customer conversations 24/7 with AI.</p>
      </div>
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardContent className="pt-8 pb-8">
          <div className="text-center max-w-lg mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-purple-900">AI WhatsApp Business Bot</h2>
            <p className="text-purple-800/80 text-sm">
              Deploy a 24/7 AI agent on your dedicated WhatsApp number. Handle support, sales, bookings, and more — automatically.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-left max-w-md mx-auto">
              {[
                "Unlimited chatbot sessions",
                "OpenAI GPT-4o or Google Gemini",
                "Bulk broadcast messages",
                "Shared team conversation inbox",
                "Webhook & API integration",
                "Business hours & auto-replies",
                "Human handoff keyword",
                "Multi-language support",
                "Customer number privacy",
                "5 system prompt presets",
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-purple-800">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" /> {f}
                </div>
              ))}
            </div>
            <Link href="/dashboard/subscription">
              <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2 mt-2">
                <Zap className="h-4 w-4" /> Upgrade to Business <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BotPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: sub } = useGetCurrentSubscription();
  const planName: string = (sub as any)?.plan?.name || "Free";
  const isEligible = ["Business", "Enterprise"].includes(planName);

  const { data: rawConfig, isLoading } = useQuery({
    queryKey: ["bot-config"],
    queryFn: () => apiFetch("/bot/config"),
    retry: false,
  });

  const { data: sessions = [], refetch: refetchSessions } = useQuery<Session[]>({
    queryKey: ["bot-sessions"],
    queryFn: () => apiFetch("/bot/sessions"),
    refetchInterval: 10000,
    enabled: isEligible,
  });

  const { data: broadcasts = [], refetch: refetchBroadcasts } = useQuery<any[]>({
    queryKey: ["broadcasts"],
    queryFn: () => apiFetch("/broadcasts"),
    refetchInterval: 8000,
    enabled: isEligible,
  });

  const [config, setConfig] = useState<BotConfig>(DEFAULTS);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<ConvMsg[]>([]);
  const [replyText, setReplyText] = useState("");
  const [broadcastName, setBroadcastName] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastNumbers, setBroadcastNumbers] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inboxEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rawConfig) {
      setConfig({
        ...DEFAULTS,
        ...rawConfig,
        features: typeof rawConfig.features === "string"
          ? JSON.parse(rawConfig.features || "[]")
          : rawConfig.features || [],
      });
    }
  }, [rawConfig]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLog]);
  useEffect(() => { inboxEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convMessages]);

  const loadConversation = async (phone: string) => {
    setSelectedPhone(phone);
    const msgs = await apiFetch(`/bot/conversations/${encodeURIComponent(phone)}`);
    setConvMessages(msgs);
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/bot/config", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-config"] });
      toast({ title: "Saved", description: "Bot configuration updated." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Save failed", description: e.message }),
  });

  const handleSave = () => {
    const payload: any = { ...config };
    if (apiKey) payload.apiKey = apiKey;
    saveMutation.mutate(payload);
  };

  const testMutation = useMutation({
    mutationFn: (message: string) => apiFetch("/bot/test", { method: "POST", body: JSON.stringify({ message }) }),
    onSuccess: (data) => {
      setChatLog(prev => [...prev.filter(m => !m.loading), { role: "bot", text: data.reply }]);
    },
    onError: (e: any) => {
      setChatLog(prev => prev.filter(m => !m.loading));
      toast({ variant: "destructive", title: "Test failed", description: e.message });
    },
  });

  const handleTest = () => {
    if (!testInput.trim()) return;
    const msg = testInput.trim();
    setTestInput("");
    setChatLog(prev => [...prev, { role: "user", text: msg }, { role: "bot", text: "", loading: true }]);
    testMutation.mutate(msg);
  };

  const replyMutation = useMutation({
    mutationFn: ({ phone, message }: { phone: string; message: string }) =>
      apiFetch(`/bot/conversations/${encodeURIComponent(phone)}/reply`, { method: "POST", body: JSON.stringify({ message }) }),
    onSuccess: (_, { phone }) => {
      setReplyText("");
      loadConversation(phone);
      toast({ title: "Sent", description: "Message delivered." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Send failed", description: e.message }),
  });

  const clearConvMutation = useMutation({
    mutationFn: (phone: string) =>
      apiFetch(`/bot/conversations/${encodeURIComponent(phone)}`, { method: "DELETE" }),
    onSuccess: () => {
      setConvMessages([]);
      setSelectedPhone(null);
      refetchSessions();
      toast({ title: "Cleared", description: "Conversation history deleted." });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: (data: { name: string; message: string; recipients: string[] }) =>
      apiFetch("/broadcasts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      setBroadcastName(""); setBroadcastMsg(""); setBroadcastNumbers("");
      refetchBroadcasts();
      toast({ title: "Broadcast queued!", description: "Messages are being sent." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Broadcast failed", description: e.message }),
  });

  const handleBroadcast = () => {
    const recipients = broadcastNumbers.split(/[\n,]/).map(n => n.trim()).filter(Boolean);
    if (!broadcastName || !broadcastMsg || recipients.length === 0) {
      toast({ variant: "destructive", title: "Fill all fields", description: "Name, message, and phone numbers are required." });
      return;
    }
    broadcastMutation.mutate({ name: broadcastName, message: broadcastMsg, recipients });
  };

  const toggleFeature = (id: string) => {
    setConfig(c => ({
      ...c,
      features: c.features.includes(id) ? c.features.filter(f => f !== id) : [...c.features, id],
    }));
  };

  if (!isEligible) return <UpsellGate />;

  const models = config.provider === "gemini" ? GEMINI_MODELS : OPENAI_MODELS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-purple-600" /> WhatsApp AI Bot
          </h1>
          <p className="text-muted-foreground mt-1">Your 24/7 AI agent on WhatsApp.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
            <BarChart3 className="h-4 w-4" />
            {(rawConfig?.totalMessages || 0).toLocaleString()} messages handled
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30">
            <Switch id="bot-enabled" checked={config.enabled}
              onCheckedChange={v => setConfig(c => ({ ...c, enabled: v }))} />
            <Label htmlFor="bot-enabled" className="text-sm font-medium cursor-pointer">
              {config.enabled
                ? <span className="text-emerald-600 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Live</span>
                : <span className="text-muted-foreground">Disabled</span>}
            </Label>
          </div>
        </div>
      </div>

      {!config.hasApiKey && !apiKey && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
          Add your OpenAI or Gemini API key in the Setup tab and click Save to activate the bot.
        </div>
      )}

      <Tabs defaultValue="setup">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {[
            { v: "setup", icon: Settings2, label: "Setup" },
            { v: "identity", icon: Sparkles, label: "Identity" },
            { v: "rules", icon: Clock, label: "Rules" },
            { v: "test", icon: MessageSquare, label: "Test Chat" },
            { v: "inbox", icon: Inbox, label: `Inbox${sessions.length ? ` (${sessions.length})` : ""}` },
            { v: "broadcast", icon: Megaphone, label: "Broadcast" },
          ].map(({ v, icon: Icon, label }) => (
            <TabsTrigger key={v} value={v} className="text-xs gap-1.5 data-[state=active]:shadow-sm">
              <Icon className="h-3.5 w-3.5" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Setup tab ── */}
        <TabsContent value="setup" className="space-y-4 mt-4">
          {/* AI Provider */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" /> AI Provider
              </CardTitle>
              <CardDescription>Choose your AI. Bring your own API key — zero markup from us.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "openai", name: "OpenAI", sub: "GPT-4o, GPT-4o Mini", ring: "ring-emerald-400 bg-emerald-50 border-emerald-400" },
                  { id: "gemini", name: "Google Gemini", sub: "2.0 Flash, 1.5 Pro", ring: "ring-blue-400 bg-blue-50 border-blue-400" },
                ].map(p => (
                  <button key={p.id} onClick={() => setConfig(c => ({
                    ...c, provider: p.id,
                    model: p.id === "gemini" ? "gemini-2.0-flash" : "gpt-4o-mini",
                  }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${config.provider === p.id
                      ? `${p.ring} ring-2 ring-offset-1`
                      : "border-muted hover:border-muted-foreground/40"}`}>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.sub}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2"><Key className="h-3.5 w-3.5" />API Key</Label>
                <div className="flex gap-2">
                  <Input type={showKey ? "text" : "password"}
                    placeholder={config.hasApiKey ? "●●●●●●●●●●●● (saved — paste to update)" : "Paste your API key here"}
                    value={apiKey} onChange={e => setApiKey(e.target.value)} className="flex-1" />
                  <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {config.hasApiKey && !apiKey && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> API key saved. Leave blank to keep existing.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {config.provider === "gemini" ? "→ aistudio.google.com/apikey" : "→ platform.openai.com/api-keys"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Model</Label>
                  <Select value={config.model || ""} onValueChange={v => setConfig(c => ({ ...c, model: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{models.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Response Language</Label>
                  <Select value={config.language} onValueChange={v => setConfig(c => ({ ...c, language: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Max response tokens</Label>
                <Select value={String(config.maxTokens)} onValueChange={v => setConfig(c => ({ ...c, maxTokens: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[150, 300, 500, 800, 1200].map(t => (
                      <SelectItem key={t} value={String(t)}>{t} tokens (~{Math.round(t * 0.75)} words)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Capabilities</CardTitle>
              <CardDescription>What your bot helps customers with — injected into the AI context.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {FEATURES.map(f => (
                  <label key={f.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${config.features.includes(f.id) ? "border-emerald-300 bg-emerald-50" : "hover:bg-muted/40"}`}>
                    <Checkbox checked={config.features.includes(f.id)} onCheckedChange={() => toggleFeature(f.id)} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <f.icon className="h-3.5 w-3.5 text-emerald-600" />{f.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Webhook */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="h-4 w-4 text-indigo-500" /> Webhook Integration
              </CardTitle>
              <CardDescription>
                Forward all incoming messages to your URL (Zapier, Make, n8n, or your own backend).
                Events: <code className="text-xs bg-muted px-1 rounded">message.incoming</code> · <code className="text-xs bg-muted px-1 rounded">message.outgoing</code> · <code className="text-xs bg-muted px-1 rounded">handoff.requested</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={config.webhookUrl}
                onChange={e => setConfig(c => ({ ...c, webhookUrl: e.target.value }))}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
              {config.webhookUrl && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Webhook active — events POSTed with JSON body + X-AchekOTP-Event header.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Identity tab ── */}
        <TabsContent value="identity" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bot Personality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Bot Name</Label>
                  <Input value={config.botName} onChange={e => setConfig(c => ({ ...c, botName: e.target.value }))} maxLength={30} placeholder="AchekBot" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Response delay (ms)</Label>
                  <Select value={String(config.responseDelayMs)} onValueChange={v => setConfig(c => ({ ...c, responseDelayMs: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Instant</SelectItem>
                      <SelectItem value="800">0.8s — Natural</SelectItem>
                      <SelectItem value="1500">1.5s — Human-like</SelectItem>
                      <SelectItem value="3000">3s — Realistic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Welcome Message <span className="text-muted-foreground font-normal">(sent on first contact)</span></Label>
                <Textarea value={config.welcomeMessage} onChange={e => setConfig(c => ({ ...c, welcomeMessage: e.target.value }))} rows={2} placeholder="Hi! 👋 How can I help you today?" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Fallback Message <span className="text-muted-foreground font-normal">(when AI fails)</span></Label>
                <Textarea value={config.fallbackMessage} onChange={e => setConfig(c => ({ ...c, fallbackMessage: e.target.value }))} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">System Prompt</CardTitle>
              <CardDescription>The AI's core instructions. Click a preset or write your own.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SYSTEM_PRESETS.map(p => (
                  <Button key={p.id} variant="outline" size="sm" className="h-7 text-xs"
                    onClick={() => setConfig(c => ({ ...c, systemPrompt: p.prompt }))}>
                    {p.label}
                  </Button>
                ))}
              </div>
              <Textarea value={config.systemPrompt} onChange={e => setConfig(c => ({ ...c, systemPrompt: e.target.value }))}
                rows={8} className="font-mono text-sm" placeholder="You are a helpful assistant for {your company}..." />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rules tab ── */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          {/* Business hours */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" /> Business Hours
                  </CardTitle>
                  <CardDescription>Only respond with AI during set hours. Auto-reply outside hours.</CardDescription>
                </div>
                <Switch checked={config.businessHoursEnabled}
                  onCheckedChange={v => setConfig(c => ({ ...c, businessHoursEnabled: v }))} />
              </div>
            </CardHeader>
            {config.businessHoursEnabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Open from</Label>
                    <Input type="time" value={config.businessHoursStart}
                      onChange={e => setConfig(c => ({ ...c, businessHoursStart: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Close at</Label>
                    <Input type="time" value={config.businessHoursEnd}
                      onChange={e => setConfig(c => ({ ...c, businessHoursEnd: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Timezone</Label>
                    <Select value={config.businessHoursTimezone}
                      onValueChange={v => setConfig(c => ({ ...c, businessHoursTimezone: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Outside hours message</Label>
                  <Textarea value={config.outsideHoursMessage}
                    onChange={e => setConfig(c => ({ ...c, outsideHoursMessage: e.target.value }))}
                    rows={2} placeholder={`Hi! We're closed right now (${config.businessHoursStart}–${config.businessHoursEnd}). We'll get back to you soon.`} />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Human handoff */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-orange-500" /> Human Handoff
              </CardTitle>
              <CardDescription>When a customer types a specific word, stop the bot and alert your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Trigger keyword</Label>
                  <Input value={config.handoffKeyword}
                    onChange={e => setConfig(c => ({ ...c, handoffKeyword: e.target.value }))}
                    placeholder="agent, human, help, escalate" />
                  <p className="text-xs text-muted-foreground">Case-insensitive substring match.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Handoff message</Label>
                  <Textarea value={config.handoffMessage}
                    onChange={e => setConfig(c => ({ ...c, handoffMessage: e.target.value }))}
                    rows={2} placeholder="Connecting you to a human agent. Please wait..." />
                </div>
              </div>
              {config.webhookUrl && (
                <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                  A <code>handoff.requested</code> webhook event will also be sent to your configured webhook URL.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Test Chat tab ── */}
        <TabsContent value="test" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" /> Live Test Chat
              </CardTitle>
              <CardDescription>Test your bot right here before it goes live. Save first to use latest config.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-72 overflow-y-auto rounded-xl border bg-[#e5ddd5] p-4 space-y-3">
                {chatLog.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500 text-sm bg-white/70 rounded-xl px-4 py-3">
                      <Bot className="h-7 w-7 mx-auto mb-2 opacity-40" />
                      Type a message to test your bot
                    </div>
                  </div>
                )}
                {chatLog.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user" ? "bg-[#dcf8c6] rounded-br-sm" : "bg-white rounded-bl-sm"
                    }`}>
                      {msg.loading ? (
                        <span className="flex gap-1 items-center py-1">
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                        </span>
                      ) : msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <Input value={testInput} onChange={e => setTestInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleTest()}
                  placeholder="Type a test message..." disabled={testMutation.isPending} />
                <Button onClick={handleTest} disabled={testMutation.isPending || !testInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
                {chatLog.length > 0 && (
                  <Button variant="outline" size="icon" onClick={() => setChatLog([])}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inbox tab ── */}
        <TabsContent value="inbox" className="mt-4">
          <div className="grid sm:grid-cols-5 gap-4 h-[540px]">
            {/* Sessions list */}
            <div className="sm:col-span-2 border rounded-xl overflow-hidden flex flex-col">
              <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Inbox className="h-4 w-4" /> Conversations
                </p>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchSessions()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y">
                {sessions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Phone className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    No conversations yet. Once customers message your number, they appear here.
                  </div>
                ) : sessions.map(s => (
                  <button key={s.phone} onClick={() => loadConversation(s.phone)}
                    className={`w-full text-left p-3 hover:bg-muted/40 transition-colors ${selectedPhone === s.phone ? "bg-emerald-50 border-l-2 border-emerald-500" : ""}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-mono text-sm font-medium">{s.phone}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(s.lastMessageAt), "HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.lastRole === "assistant" ? "Bot: " : "Customer: "}{s.lastMessage}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation view */}
            <div className="sm:col-span-3 border rounded-xl overflow-hidden flex flex-col">
              {!selectedPhone ? (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-6">
                  <div>
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Select a conversation to view messages</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium">{selectedPhone}</p>
                      <p className="text-xs text-muted-foreground">{convMessages.length} messages</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => clearConvMutation.mutate(selectedPhone!)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-[#e5ddd5] p-3 space-y-2">
                    {convMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === "assistant" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm leading-relaxed ${
                          msg.role === "assistant" ? "bg-[#dcf8c6] rounded-br-sm" : "bg-white rounded-bl-sm"
                        }`}>
                          <p>{msg.content}</p>
                          <p className="text-[10px] text-gray-400 mt-1 text-right">
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={inboxEndRef} />
                  </div>
                  <div className="p-2 border-t bg-white flex gap-2">
                    <Input value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && replyText.trim() && replyMutation.mutate({ phone: selectedPhone!, message: replyText })}
                      placeholder="Reply as agent..." className="text-sm" />
                    <Button size="sm" onClick={() => replyMutation.mutate({ phone: selectedPhone!, message: replyText })}
                      disabled={!replyText.trim() || replyMutation.isPending} className="gap-1.5">
                      <Reply className="h-3.5 w-3.5" /> Send
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Broadcast tab ── */}
        <TabsContent value="broadcast" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Compose */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-500" /> Send Bulk Message
                </CardTitle>
                <CardDescription>Send a WhatsApp message to a list of phone numbers at once.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Campaign name</Label>
                  <Input value={broadcastName} onChange={e => setBroadcastName(e.target.value)} placeholder="June Promo" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Message</Label>
                  <Textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                    rows={4} placeholder="Hi {{name}}, we have a special offer just for you! 🎉" />
                  <p className="text-xs text-muted-foreground">{broadcastMsg.length} / 1000 chars</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> Phone numbers
                  </Label>
                  <Textarea value={broadcastNumbers} onChange={e => setBroadcastNumbers(e.target.value)}
                    rows={5} placeholder={"+2348012345678\n+2347098765432\n+2349087654321\n..."} className="font-mono text-xs" />
                  <p className="text-xs text-muted-foreground">
                    {broadcastNumbers.split(/[\n,]/).filter(n => n.trim()).length} numbers · One per line or comma-separated · Max 1000
                  </p>
                </div>
                <Button className="w-full gap-2" onClick={handleBroadcast} disabled={broadcastMutation.isPending}>
                  {broadcastMutation.isPending
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Queuing...</>
                    : <><Megaphone className="h-4 w-4" /> Send Broadcast</>}
                </Button>
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Broadcast History</CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchBroadcasts()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {broadcasts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
                    <Megaphone className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    No broadcasts yet. Send your first one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {broadcasts.map(b => (
                      <div key={b.id} className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{b.name}</p>
                          <Badge className={
                            b.status === "done" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                            b.status === "sending" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                            "bg-gray-100 text-gray-700"
                          }>{b.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{b.message}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{b.total} total</span>
                          <span className="text-emerald-600">{b.sent} sent</span>
                          {b.failedCount > 0 && <span className="text-red-500">{b.failedCount} failed</span>}
                          <span className="ml-auto">{format(new Date(b.createdAt), "MMM d, HH:mm")}</span>
                        </div>
                        {b.status === "sending" && (
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.round((b.sent / b.total) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2 min-w-36">
          {saveMutation.isPending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Configuration</>}
        </Button>
      </div>
    </div>
  );
}
