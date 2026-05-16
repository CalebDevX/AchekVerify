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
  Bot, Zap, Key, MessageSquare, Settings2, Save,
  Send, RefreshCw, Eye, EyeOff, AlertCircle, CheckCircle2,
  Sparkles, Users, ShoppingCart, HelpCircle, Lock, ArrowRight
} from "lucide-react";
import { useGetCurrentSubscription } from "@workspace/api-client-react";
import { Link } from "wouter";

const BASE_URL = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}/api`
  : "/api";

function getToken() { return localStorage.getItem("token") || ""; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json", ...opts.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error || `Request failed: ${res.status}`);
  }
  return res.json();
}

const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast, affordable)" },
  { value: "gpt-4o", label: "GPT-4o (Smarter, higher cost)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
];

const GEMINI_MODELS = [
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Fast, free tier)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Smarter)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Latest)" },
];

const SYSTEM_PRESETS = [
  {
    id: "customer_support",
    label: "Customer Support",
    prompt: `You are a helpful customer support agent for {company}. Your job is to assist customers with their questions, resolve issues professionally, and escalate complex problems when needed. Be friendly, concise, and always stay on topic. If you cannot help, politely ask the customer to contact support via email.`,
  },
  {
    id: "sales",
    label: "Sales Assistant",
    prompt: `You are a knowledgeable sales assistant for {company}. Help potential customers understand products/services, answer questions about pricing and features, and guide them toward making a purchase. Be enthusiastic but not pushy. Always be honest about what you offer.`,
  },
  {
    id: "faq",
    label: "FAQ Bot",
    prompt: `You are an FAQ bot for {company}. Answer common questions clearly and concisely. If a question is not in your knowledge, say "I don't have that information — please contact our team." Keep responses short and direct.`,
  },
  {
    id: "appointment",
    label: "Appointment Booking",
    prompt: `You are an appointment scheduling assistant for {company}. Help customers book, reschedule, or cancel appointments. Collect their name, contact number, preferred date/time, and service needed. Confirm all bookings clearly.`,
  },
];

const FEATURES = [
  { id: "otp_help", label: "OTP Assistance", icon: Key, desc: "Help customers who receive OTP codes" },
  { id: "faq", label: "FAQ Answering", icon: HelpCircle, desc: "Answer common questions automatically" },
  { id: "lead_capture", label: "Lead Capture", icon: Users, desc: "Collect name, email, phone from prospects" },
  { id: "order_tracking", label: "Order Tracking", icon: ShoppingCart, desc: "Help customers track their orders" },
];

type ChatMsg = { role: "user" | "bot"; text: string; loading?: boolean };

type BotConfig = {
  enabled: boolean;
  provider: string;
  model: string;
  botName: string;
  systemPrompt: string;
  welcomeMessage: string;
  fallbackMessage: string;
  features: string[];
  maxTokens: number;
  hasApiKey: boolean;
  totalMessages: number;
};

const DEFAULTS: BotConfig = {
  enabled: false,
  provider: "openai",
  model: "gpt-4o-mini",
  botName: "AchekBot",
  systemPrompt: SYSTEM_PRESETS[0].prompt,
  welcomeMessage: "Hi! 👋 How can I help you today?",
  fallbackMessage: "Sorry, I'm having trouble right now. Please try again or contact our support team.",
  features: ["otp_help", "faq"],
  maxTokens: 500,
  hasApiKey: false,
  totalMessages: 0,
};

export default function BotPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: sub } = useGetCurrentSubscription();
  const plan = (sub as any)?.plan;
  const planName: string = plan?.name || "Free";
  const isEligible = ["Business", "Enterprise"].includes(planName);

  const { data: rawConfig, isLoading } = useQuery({
    queryKey: ["bot-config"],
    queryFn: () => apiFetch("/bot/config"),
    retry: false,
  });

  const [config, setConfig] = useState<BotConfig>(DEFAULTS);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/bot/config", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bot-config"] });
      toast({ title: "Bot saved", description: "Your bot configuration has been updated." });
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
    onSuccess: (data, message) => {
      setChatLog(prev => [
        ...prev.filter(m => !m.loading),
        { role: "bot", text: data.reply },
      ]);
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

  const toggleFeature = (id: string) => {
    setConfig(c => ({
      ...c,
      features: c.features.includes(id) ? c.features.filter(f => f !== id) : [...c.features, id],
    }));
  };

  if (!isEligible) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp AI Bot</h1>
          <p className="text-muted-foreground mt-1">Automate customer conversations with an AI-powered WhatsApp agent.</p>
        </div>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-purple-900">AI Bot — Business & Enterprise</h2>
              <p className="text-purple-800/80 text-sm">
                Deploy a 24/7 AI-powered WhatsApp agent on your dedicated number. Powered by OpenAI or Gemini.
                Handle support, sales, FAQ, lead capture, and more — automatically.
              </p>
              <ul className="text-sm text-left space-y-2 text-purple-800 max-w-xs mx-auto">
                {[
                  "Works on your dedicated WhatsApp number",
                  "Choose OpenAI (GPT-4o) or Google Gemini",
                  "Bring your own AI API key",
                  "Custom personality & system prompt",
                  "Conversation history per customer",
                  "Feature toggles: FAQ, leads, orders, OTP",
                  "Live test chat in dashboard",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/subscription">
                <Button className="bg-purple-700 hover:bg-purple-800 text-white gap-2 mt-2">
                  <Zap className="h-4 w-4" /> Upgrade to Business
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const models = config.provider === "gemini" ? GEMINI_MODELS : OPENAI_MODELS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-purple-600" />
            WhatsApp AI Bot
          </h1>
          <p className="text-muted-foreground mt-1">Configure your AI agent to handle customer conversations automatically.</p>
        </div>
        <div className="flex items-center gap-3">
          {rawConfig && (
            <span className="text-xs text-muted-foreground">{(rawConfig.totalMessages || 0).toLocaleString()} messages handled</span>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30">
            <Switch
              id="bot-enabled"
              checked={config.enabled}
              onCheckedChange={v => setConfig(c => ({ ...c, enabled: v }))}
            />
            <Label htmlFor="bot-enabled" className="text-sm font-medium cursor-pointer">
              {config.enabled ? (
                <span className="text-emerald-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Active</span>
              ) : "Disabled"}
            </Label>
          </div>
        </div>
      </div>

      {!config.hasApiKey && !apiKey && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
          Add your OpenAI or Gemini API key below to activate the bot. You bring your own key — AchekOTP never charges for AI usage.
        </div>
      )}

      <Tabs defaultValue="setup">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="setup"><Settings2 className="h-4 w-4 mr-1.5" />Setup</TabsTrigger>
          <TabsTrigger value="personality"><Sparkles className="h-4 w-4 mr-1.5" />Identity</TabsTrigger>
          <TabsTrigger value="test"><MessageSquare className="h-4 w-4 mr-1.5" />Test Chat</TabsTrigger>
        </TabsList>

        {/* ── Setup tab ── */}
        <TabsContent value="setup" className="space-y-4 mt-4">
          {/* AI Provider */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />AI Provider</CardTitle>
              <CardDescription>Choose which AI powers your bot. Bring your own API key.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "openai", label: "OpenAI", sub: "GPT-4o, GPT-4o Mini", color: "border-emerald-400 bg-emerald-50" },
                  { id: "gemini", label: "Google Gemini", sub: "Gemini 1.5 Flash/Pro", color: "border-blue-400 bg-blue-50" },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setConfig(c => ({
                        ...c,
                        provider: p.id,
                        model: p.id === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini",
                      }));
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      config.provider === p.id ? p.color + " ring-2 ring-offset-1 ring-current" : "border-muted hover:border-muted-foreground/40"
                    }`}
                  >
                    <p className="font-semibold text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.sub}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2"><Key className="h-3.5 w-3.5" />API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder={config.hasApiKey ? "●●●●●●●●●●●● (saved — paste to update)" : `Paste your ${config.provider === "gemini" ? "Google AI" : "OpenAI"} API key`}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {config.hasApiKey && !apiKey && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> API key is saved. Leave blank to keep existing.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {config.provider === "gemini"
                    ? "Get your key at: console.cloud.google.com/apis → Gemini API"
                    : "Get your key at: platform.openai.com/api-keys"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Model</Label>
                <Select value={config.model || ""} onValueChange={v => setConfig(c => ({ ...c, model: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Max response length (tokens)</Label>
                <Select value={String(config.maxTokens)} onValueChange={v => setConfig(c => ({ ...c, maxTokens: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[200, 300, 500, 800, 1000].map(t => (
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
              <CardDescription>What your bot can help customers with.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {FEATURES.map(f => (
                  <label
                    key={f.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      config.features.includes(f.id) ? "border-emerald-300 bg-emerald-50" : "hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox
                      checked={config.features.includes(f.id)}
                      onCheckedChange={() => toggleFeature(f.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <f.icon className="h-3.5 w-3.5 text-emerald-600" />{f.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Identity tab ── */}
        <TabsContent value="personality" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bot Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Bot Name</Label>
                <Input
                  value={config.botName}
                  onChange={e => setConfig(c => ({ ...c, botName: e.target.value }))}
                  placeholder="AchekBot"
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Welcome Message</Label>
                <Textarea
                  value={config.welcomeMessage}
                  onChange={e => setConfig(c => ({ ...c, welcomeMessage: e.target.value }))}
                  placeholder="Hi! 👋 How can I help you today?"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">Sent when a customer messages for the first time.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Fallback Message</Label>
                <Textarea
                  value={config.fallbackMessage}
                  onChange={e => setConfig(c => ({ ...c, fallbackMessage: e.target.value }))}
                  placeholder="Sorry, I'm having trouble right now. Please try again."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">Sent when the AI fails or is unavailable.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">System Prompt</CardTitle>
              <CardDescription>Instructions for how your bot should behave.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Presets</p>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_PRESETS.map(p => (
                    <Button
                      key={p.id}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setConfig(c => ({ ...c, systemPrompt: p.prompt }))}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                value={config.systemPrompt}
                onChange={e => setConfig(c => ({ ...c, systemPrompt: e.target.value }))}
                placeholder="You are a helpful assistant for {company}. Always be professional and friendly..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Replace <code className="bg-muted px-1 rounded">{"{company}"}</code> with your actual business name in the prompt.
              </p>
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
              <CardDescription>
                Test your bot right here before it goes live. {!config.hasApiKey && !apiKey && "⚠️ Save your API key first."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Chat window */}
              <div className="h-80 overflow-y-auto rounded-xl border bg-muted/20 p-4 space-y-3">
                {chatLog.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                    <div>
                      <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Send a test message to see how your bot responds.</p>
                    </div>
                  </div>
                )}
                {chatLog.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-white border rounded-bl-sm shadow-sm"
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
                <Input
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleTest()}
                  placeholder="Type a test message..."
                  disabled={testMutation.isPending}
                />
                <Button onClick={handleTest} disabled={testMutation.isPending || !testInput.trim()} className="gap-2">
                  <Send className="h-4 w-4" />
                </Button>
                {chatLog.length > 0 && (
                  <Button variant="outline" size="icon" onClick={() => setChatLog([])}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Test uses your saved configuration. Changes must be saved first.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2 min-w-32">
          {saveMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saveMutation.isPending ? "Saving…" : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
