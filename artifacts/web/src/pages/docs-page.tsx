import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, ChevronRight, Terminal, Shield, Zap, AlertCircle, Globe, BookOpen, Code2, Key, RefreshCw, Lock } from "lucide-react";

const BASE = "https://verify.achek.com.ng/api";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "quickstart", label: "Quick Start" },
  { id: "auth", label: "Authentication" },
  { id: "send", label: "Send OTP" },
  { id: "verify", label: "Verify OTP" },
  { id: "password-reset", label: "Password Reset" },
  { id: "phone-verify", label: "Phone Verification" },
  { id: "errors", label: "Error Codes" },
  { id: "limits", label: "Plans & Limits" },
  { id: "best-practices", label: "Best Practices" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
    </button>
  );
}

function Code({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative group">
      <pre className="bg-gray-950 text-gray-100 rounded-xl p-4 text-sm font-mono overflow-x-auto leading-relaxed border border-gray-800">
        {code}
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

function Method({ m }: { m: string }) {
  const c: Record<string, string> = { GET: "bg-blue-500/20 text-blue-300 border-blue-500/30", POST: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", DELETE: "bg-red-500/20 text-red-300 border-red-500/30" };
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${c[m] || "bg-gray-500/20 text-gray-300"}`}>{m}</span>;
}

function Section({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 mb-14">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">{icon}</div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ParamTable({ rows }: { rows: { name: string; type: string; required?: boolean; desc: string }[] }) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900/60 border-b border-gray-800">
            <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Parameter</th>
            <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Type</th>
            <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Required</th>
            <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {rows.map(r => (
            <tr key={r.name} className="bg-gray-950/50">
              <td className="px-4 py-2.5 font-mono text-emerald-400 text-xs">{r.name}</td>
              <td className="px-4 py-2.5 text-gray-500 text-xs">{r.type}</td>
              <td className="px-4 py-2.5 text-xs">{r.required ? <span className="text-red-400 font-medium">Yes</span> : <span className="text-gray-600">No</span>}</td>
              <td className="px-4 py-2.5 text-gray-400 text-xs">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SEND_JS = `const res = await fetch("${BASE}/otp/send", {
  method: "POST",
  headers: {
    "x-api-key": "watp_your_api_key",   // from dashboard → API Keys
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phoneNumber: "+2348012345678",         // E.164 format required
    template: "Hi! Your code is {{code}} — valid 10 min.", // optional
  }),
});

const { requestId, expiresAt } = await res.json();
// ⚠️  Store requestId — you need it to verify the code`;

const SEND_PY = `import requests

res = requests.post(
    "${BASE}/otp/send",
    headers={"x-api-key": "watp_your_api_key", "Content-Type": "application/json"},
    json={"phoneNumber": "+2348012345678", "template": "Your code is {{code}}"},
)
data = res.json()
request_id = data["requestId"]  # store this`;

const SEND_PHP = `<?php
$ch = curl_init("${BASE}/otp/send");
curl_setopt_array($ch, [
  CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["x-api-key: watp_your_api_key", "Content-Type: application/json"],
  CURLOPT_POSTFIELDS => json_encode(["phoneNumber" => "+2348012345678"]),
]);
$data = json_decode(curl_exec($ch), true);
$requestId = $data["requestId"];`;

const SEND_CURL = `curl -X POST ${BASE}/otp/send \\
  -H "x-api-key: watp_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber":"+2348012345678","template":"Your code is {{code}}"}'

# 200 Response:
# {
#   "requestId": "otp_a1b2c3d4...",
#   "expiresAt": "2025-01-01T00:10:00.000Z",
#   "message": "OTP sent to +2348012345678"
# }`;

const VERIFY_JS = `const res = await fetch("${BASE}/otp/verify", {
  method: "POST",
  headers: {
    "x-api-key": "watp_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    requestId: "otp_a1b2c3d4...", // from the send response
    code: userEnteredCode,         // 6-digit code your user typed
  }),
});

const { valid, message } = await res.json();

if (valid) {
  // ✅ Identity confirmed — proceed with login/action
  await loginUser();
} else {
  // ❌ Wrong code, already used, or expired
  showError(message);
}`;

const VERIFY_CURL = `curl -X POST ${BASE}/otp/verify \\
  -H "x-api-key: watp_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"requestId":"otp_a1b2c3d4...","code":"847293"}'

# Success:    { "valid": true,  "message": "OTP verified successfully" }
# Wrong code: { "valid": false, "message": "Invalid OTP code" }
# Expired:    { "valid": false, "message": "OTP expired" }
# Used:       { "valid": false, "message": "OTP already used" }`;

const RESET_JS = `// ── Step 1: User enters their phone number ──────────────────────────────────
await fetch("${BASE}/auth/forgot-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phoneNumber: "+2348012345678" }),
});
// Always returns 200 (user enumeration protection)

// ── Step 2: User receives OTP on WhatsApp and enters it ─────────────────────
const res = await fetch("${BASE}/auth/reset-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phoneNumber: "+2348012345678",
    code: "847293",
    newPassword: "NewSecure@Password123",
  }),
});
const { success, message } = await res.json();`;

export default function DocsPage() {
  const [sendTab, setSendTab] = useState<"JS" | "Python" | "PHP" | "cURL">("JS");
  const [verifyTab, setVerifyTab] = useState<"JS" | "cURL">("JS");

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${active ? "bg-emerald-500/20 text-emerald-300" : "text-gray-500 hover:text-gray-300"}`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top nav */}
      <div className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="container mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/logo.svg" alt="AchekOTP" className="h-7 w-7" />
              <span className="font-bold text-white">AchekOTP</span>
              <span className="text-gray-600 mx-1">/</span>
              <span className="text-gray-400 text-sm">Docs</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <a href="/api/docs" target="_blank" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5" /> API Explorer
            </a>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs">
                Get API Key
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-10 flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-3">Contents</p>
          <nav className="space-y-0.5">
            {NAV.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-8 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-xs text-emerald-400 font-semibold mb-1">Live API Explorer</p>
            <p className="text-xs text-gray-500 mb-2">Try every endpoint in the browser.</p>
            <a href="/api/docs" target="_blank">
              <Button size="sm" variant="outline" className="w-full text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-7">
                Open Swagger UI
              </Button>
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">

          {/* ── Overview ── */}
          <Section id="overview" title="Overview" icon={<BookOpen className="h-4 w-4" />}>
            <div className="prose prose-invert max-w-none text-sm text-gray-400 space-y-4">
              <p className="text-base text-gray-300 leading-relaxed">
                <strong className="text-white">AchekOTP</strong> is a WhatsApp-powered OTP (one-time password) delivery engine.
                Instead of expensive SMS, your app sends verification codes through WhatsApp — which has a 98% open rate
                versus 20% for SMS. Integration takes under 5 minutes.
              </p>
              <div className="grid grid-cols-3 gap-3 not-prose">
                {[
                  { icon: <Zap className="h-4 w-4" />, title: "2 API calls", sub: "Send + Verify. That's it." },
                  { icon: <Globe className="h-4 w-4" />, title: "Global reach", sub: "Any WhatsApp number worldwide" },
                  { icon: <Shield className="h-4 w-4" />, title: "Secure by default", sub: "10-min expiry, single-use codes" },
                ].map(({ icon, title, sub }) => (
                  <div key={title} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                    <div className="text-emerald-400 mb-2">{icon}</div>
                    <p className="font-semibold text-white text-sm">{title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 not-prose">
                <p className="text-sm font-semibold text-white mb-2">Base URL</p>
                <Code code={BASE} />
              </div>
            </div>
          </Section>

          {/* ── Quick Start ── */}
          <Section id="quickstart" title="Quick Start" icon={<Zap className="h-4 w-4" />}>
            <div className="space-y-4">
              {[
                { n: 1, title: "Create account & subscribe", body: "Sign up at verify.achek.com.ng, pick a plan (Free has 10 OTPs/month), and activate your subscription." },
                { n: 2, title: "Generate an API key", body: 'In your dashboard, go to API Keys → "Create Key". Copy the key immediately — it\'s shown only once.' },
                { n: 3, title: "Send an OTP", body: "Call POST /api/otp/send from your backend with the user's phone number." },
                { n: 4, title: "Verify the code", body: "When your user enters the code, call POST /api/otp/verify with the requestId and code." },
              ].map(({ n, title, body }) => (
                <div key={n} className="flex gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/30">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{n}</div>
                  <div>
                    <p className="font-semibold text-white text-sm">{title}</p>
                    <p className="text-gray-400 text-sm mt-1">{body}</p>
                  </div>
                </div>
              ))}
              <div className="mt-2">
                <p className="text-sm font-semibold text-white mb-3">Complete example — register + verify</p>
                <Code code={`// 1. Your backend calls AchekOTP when user requests login
const sendRes = await fetch("${BASE}/otp/send", {
  method: "POST",
  headers: { "x-api-key": "watp_your_key", "Content-Type": "application/json" },
  body: JSON.stringify({ phoneNumber: "+2348012345678" }),
});
const { requestId } = await sendRes.json();
// → Save requestId in session

// 2. User receives OTP on WhatsApp, enters it in your app
// 3. Your backend verifies it
const verifyRes = await fetch("${BASE}/otp/verify", {
  method: "POST",
  headers: { "x-api-key": "watp_your_key", "Content-Type": "application/json" },
  body: JSON.stringify({ requestId, code: userEnteredCode }),
});
const { valid } = await verifyRes.json();
if (valid) grantAccess(); // ✅ done`} lang="js" />
              </div>
            </div>
          </Section>

          {/* ── Auth ── */}
          <Section id="auth" title="Authentication" icon={<Key className="h-4 w-4" />}>
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-xs">x-api-key</Badge>
                  API Key (recommended for server-to-server)
                </div>
                <p className="text-sm text-gray-400 mb-3">Send your API key in the <code className="bg-gray-800 px-1 rounded text-xs">x-api-key</code> header. All keys start with <code className="bg-gray-800 px-1 rounded text-xs">watp_</code>.</p>
                <Code code={`curl ${BASE}/otp/send \\
  -H "x-api-key: watp_live_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -X POST -d '{"phoneNumber":"+2348012345678"}'`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 font-mono text-xs">Authorization: Bearer</Badge>
                  JWT Token (for user session flows)
                </p>
                <p className="text-sm text-gray-400 mb-3">Get a JWT by calling <code className="bg-gray-800 px-1 rounded text-xs">POST /api/auth/login</code>. Expires after 30 days.</p>
                <Code code={`// Login to get token
const { token } = await (await fetch("${BASE}/auth/login", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "you@example.com", password: "yourpassword" }),
})).json();

// Use token in subsequent requests
fetch("${BASE}/auth/me", { headers: { "Authorization": \`Bearer \${token}\` } });`} lang="js" />
              </div>
              <div className="flex gap-2 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-200/80">
                  <strong>Security note:</strong> Never expose your API key in frontend code, mobile apps, or public repos. Always make AchekOTP requests from your backend server.
                </p>
              </div>
            </div>
          </Section>

          {/* ── Send OTP ── */}
          <Section id="send" title="Send OTP" icon={<Code2 className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/50">
                <Method m="POST" />
                <code className="text-sm text-gray-300 font-mono">/api/otp/send</code>
                <span className="text-gray-600 text-xs ml-auto">Requires API key or Bearer token + active subscription</span>
              </div>
              <p className="text-sm text-gray-400">Sends a 6-digit OTP to the destination WhatsApp number. Returns a <code className="bg-gray-800 px-1 rounded text-xs">requestId</code> you must save to verify the code later.</p>
              <ParamTable rows={[
                { name: "phoneNumber", type: "string", required: true, desc: "Destination in E.164 format (e.g. +2348012345678). Must be a WhatsApp-registered number." },
                { name: "template", type: "string", required: false, desc: 'Custom message. Use {{code}} as placeholder. Default: "Your AchekOTP verification code is: *{{code}}*"' },
                { name: "senderNumberId", type: "integer", required: false, desc: "ID of a specific WhatsApp sender to use. Must belong to your account or be a pool number." },
              ]} />
              <div className="flex gap-1 mb-2">
                {(["JS", "Python", "PHP", "cURL"] as const).map(l => (
                  <button key={l} className={tabClass(sendTab === l)} onClick={() => setSendTab(l)}>{l}</button>
                ))}
              </div>
              {sendTab === "JS" && <Code code={SEND_JS} lang="js" />}
              {sendTab === "Python" && <Code code={SEND_PY} lang="python" />}
              {sendTab === "PHP" && <Code code={SEND_PHP} lang="php" />}
              {sendTab === "cURL" && <Code code={SEND_CURL} />}

              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">Success Response (200)</p>
                <Code code={`{
  "requestId": "otp_a1b2c3d4e5f6...",  // save this!
  "expiresAt": "2025-01-01T00:10:00Z", // 10 minutes from now
  "message": "OTP sent to +2348012345678"
}`} />
              </div>
            </div>
          </Section>

          {/* ── Verify OTP ── */}
          <Section id="verify" title="Verify OTP" icon={<Code2 className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/50">
                <Method m="POST" />
                <code className="text-sm text-gray-300 font-mono">/api/otp/verify</code>
                <span className="text-gray-600 text-xs ml-auto">Each OTP can only be verified once</span>
              </div>
              <p className="text-sm text-gray-400">Checks if the code your user entered is correct. Returns <code className="bg-gray-800 px-1 rounded text-xs">valid: true/false</code> — your app decides what to do next.</p>
              <ParamTable rows={[
                { name: "requestId", type: "string", required: true, desc: "The requestId returned by /otp/send. Associate it with the user in your session." },
                { name: "code", type: "string", required: true, desc: "The 6-digit OTP the user entered in your app." },
              ]} />
              <div className="flex gap-1 mb-2">
                {(["JS", "cURL"] as const).map(l => (
                  <button key={l} className={tabClass(verifyTab === l)} onClick={() => setVerifyTab(l)}>{l}</button>
                ))}
              </div>
              {verifyTab === "JS" && <Code code={VERIFY_JS} lang="js" />}
              {verifyTab === "cURL" && <Code code={VERIFY_CURL} />}
            </div>
          </Section>

          {/* ── Password Reset ── */}
          <Section id="password-reset" title="Password Reset Flow" icon={<Lock className="h-4 w-4" />}>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Built-in endpoints to implement "Forgot Password" using WhatsApp OTP — no SMS gateway needed.</p>
              <div className="space-y-2">
                {[
                  { m: "POST", path: "/api/auth/forgot-password", desc: "Send a reset OTP to user's verified WhatsApp. Body: { phoneNumber }" },
                  { m: "POST", path: "/api/auth/reset-password", desc: "Verify OTP and set new password. Body: { phoneNumber, code, newPassword }" },
                ].map(({ m, path, desc }) => (
                  <div key={path} className="flex items-start gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/50">
                    <Method m={m} />
                    <div>
                      <code className="text-sm text-gray-300 font-mono">{path}</code>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Code code={RESET_JS} lang="js" />
            </div>
          </Section>

          {/* ── Phone Verify ── */}
          <Section id="phone-verify" title="Phone Verification" icon={<RefreshCw className="h-4 w-4" />}>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Verify that a user owns a phone number before linking it to their account.</p>
              <div className="space-y-2">
                {[
                  { m: "POST", path: "/api/auth/verify-phone/send", desc: "Send OTP to a phone number (requires login). Body: { phoneNumber }" },
                  { m: "POST", path: "/api/auth/verify-phone/confirm", desc: "Confirm phone ownership. Body: { phoneNumber, code }" },
                  { m: "POST", path: "/api/auth/update-phone", desc: "Update phone number (resets verification). Body: { phoneNumber }" },
                  { m: "POST", path: "/api/auth/change-password", desc: "Change password while logged in. Body: { currentPassword, newPassword }" },
                ].map(({ m, path, desc }) => (
                  <div key={path} className="flex items-start gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/50">
                    <Method m={m} />
                    <div>
                      <code className="text-sm text-gray-300 font-mono">{path}</code>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Errors ── */}
          <Section id="errors" title="Error Codes" icon={<AlertCircle className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900/60 border-b border-gray-800">
                      <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">HTTP</th>
                      <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Meaning</th>
                      <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">What to do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[
                      { c: 400, t: "Bad Request", d: "Missing required fields or invalid phone format. Check your request body." },
                      { c: 401, t: "Unauthorized", d: "Missing or invalid API key / Bearer token." },
                      { c: 402, t: "Payment Required", d: "No active subscription. Subscribe to a plan at verify.achek.com.ng/dashboard/subscription." },
                      { c: 403, t: "Forbidden", d: "Account suspended or insufficient role permissions." },
                      { c: 404, t: "Not Found", d: "OTP requestId not found. Check that you're passing the correct requestId." },
                      { c: 422, t: "Unprocessable", d: "Requested sender number is not connected. Use a different sender or let the system auto-select." },
                      { c: 429, t: "Too Many Requests", d: "Monthly OTP limit exhausted. Upgrade your plan to continue." },
                      { c: 503, t: "Service Unavailable", d: "No WhatsApp numbers connected on the platform. Contact support." },
                    ].map(({ c, t, d }) => (
                      <tr key={c} className="bg-gray-950/50">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-orange-400">{c}</td>
                        <td className="px-4 py-3 font-semibold text-xs text-white">{t}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-2">Error Response Format</p>
                <Code code={`// All error responses:
{ "error": "Human-readable description" }

// Verify response uses a different shape (never throws 4xx on wrong code):
{ "valid": false, "message": "Invalid OTP code" }
{ "valid": false, "message": "OTP expired" }
{ "valid": false, "message": "OTP already used" }`} />
              </div>
            </div>
          </Section>

          {/* ── Plans & Limits ── */}
          <Section id="limits" title="Plans & Limits" icon={<Shield className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900/60 border-b border-gray-800">
                      <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Plan</th>
                      <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Price</th>
                      <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">OTPs / Month</th>
                      <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Custom Number</th>
                      <th className="text-left px-4 py-2.5 text-gray-400 font-semibold text-xs">Branding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[
                      { n: "Free", p: "₦0", o: "10", c: false, b: true },
                      { n: "Starter", p: "₦2,500/mo", o: "500", c: false, b: false },
                      { n: "Growth", p: "₦7,500/mo", o: "2,000", c: false, b: false },
                      { n: "Business", p: "₦18,000/mo", o: "10,000", c: true, b: false },
                      { n: "Enterprise", p: "₦45,000/mo", o: "50,000", c: true, b: false },
                    ].map(({ n, p, o, c, b }) => (
                      <tr key={n} className="bg-gray-950/50">
                        <td className="px-4 py-2.5 font-semibold text-xs text-white">{n}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">{p}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-300 font-mono">{o}</td>
                        <td className="px-4 py-2.5 text-xs">{c ? <span className="text-emerald-400">✓ Yes</span> : <span className="text-gray-600">No</span>}</td>
                        <td className="px-4 py-2.5 text-xs">{b ? <span className="text-yellow-500">AchekOTP branded</span> : <span className="text-gray-600">None</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-200/80">
                  <strong>Free plan branding:</strong> Messages on the Free plan include "via AchekOTP" text. This is automatically removed on Starter and above.
                </p>
              </div>
            </div>
          </Section>

          {/* ── Best Practices ── */}
          <Section id="best-practices" title="Best Practices" icon={<BookOpen className="h-4 w-4" />}>
            <div className="space-y-3">
              {[
                { icon: "🔒", t: "Call from your backend only", b: "Never expose your API key in frontend JavaScript, React, Vue, or mobile apps. All requests should originate from your server." },
                { icon: "💾", t: "Store requestId server-side", b: "Associate the requestId with the user's session. Don't trust the client to send it — they could tamper with it." },
                { icon: "📱", t: "Use E.164 phone format", b: "Always format numbers as +[country code][number] with no spaces (e.g. +2348012345678). Invalid formats return HTTP 400." },
                { icon: "⏱️", t: "Handle expiry gracefully", b: 'OTPs expire after 10 minutes. Show a countdown timer and a "Resend OTP" button in your UI.' },
                { icon: "🔁", t: "Handle the single-use rule", b: "Once verified, an OTP cannot be reused. If you need to retry, call /otp/send again to get a new requestId." },
                { icon: "✍️", t: "Customize your template", b: 'Set a template matching your brand: "Your FlutterPay code is {{code}}". Keep it short and clear.' },
                { icon: "📊", t: "Monitor your success rate", b: "Check the dashboard regularly. Low rates often mean the recipient's number isn't on WhatsApp." },
                { icon: "🚨", t: "Handle 503 gracefully", b: "If our numbers are temporarily unavailable, show a user-friendly message and retry after a short delay." },
              ].map(({ icon, t, b }) => (
                <div key={t} className="flex gap-3 p-4 rounded-xl border border-gray-800 bg-gray-900/30">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{t}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* CTA */}
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-8 text-center mt-8">
            <p className="text-2xl font-bold text-white mb-2">Ready to integrate?</p>
            <p className="text-gray-400 mb-6">Start with 10 free OTPs — no credit card required.</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6">Get started free</Button>
              </Link>
              <a href="/api/docs" target="_blank">
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
                  <Terminal className="h-4 w-4 mr-2" /> API Explorer
                </Button>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
