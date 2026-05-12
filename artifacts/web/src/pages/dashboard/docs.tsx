import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, BookOpen, Zap, Shield, Code2, AlertCircle, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}/api`
  : "https://verify.achek.com.ng/api";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Code copied to clipboard." });
  };

  return (
    <div className="relative group">
      <pre className="p-4 rounded-lg bg-gray-950 text-gray-100 font-mono text-sm overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md p-1.5"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-emerald-600">{icon}</div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EndpointBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800",
    POST: "bg-emerald-100 text-emerald-800",
    DELETE: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold font-mono ${colors[method] || "bg-gray-100 text-gray-800"}`}>
      {method}
    </span>
  );
}

const SEND_SAMPLES: Record<string, string> = {
  cURL: `curl -X POST ${BASE_URL}/otp/send \\
  -H "x-api-key: watp_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "+2348012345678",
    "template": "Your login code is {{code}}. Valid 10 min."
  }'

# Response:
# {
#   "requestId": "otp_a1b2c3...",
#   "expiresAt": "2025-01-01T00:10:00.000Z",
#   "message": "OTP sent to +2348012345678"
# }`,

  JavaScript: `const res = await fetch("${BASE_URL}/otp/send", {
  method: "POST",
  headers: {
    "x-api-key": "watp_your_api_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phoneNumber: "+2348012345678",
    // optional: custom message (use {{code}} as placeholder)
    template: "Your login code is {{code}}. Valid 10 min.",
  }),
});

const { requestId, expiresAt } = await res.json();
// Store requestId to verify later`,

  Python: `import requests

response = requests.post(
    "${BASE_URL}/otp/send",
    headers={
        "x-api-key": "watp_your_api_key_here",
        "Content-Type": "application/json",
    },
    json={
        "phoneNumber": "+2348012345678",
        "template": "Your login code is {{code}}. Valid 10 min.",
    },
)
data = response.json()
request_id = data["requestId"]  # save for verification`,

  PHP: `<?php
$ch = curl_init("${BASE_URL}/otp/send");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "x-api-key: watp_your_api_key_here",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "phoneNumber" => "+2348012345678",
        "template" => "Your login code is {{code}}. Valid 10 min.",
    ]),
]);
$data = json_decode(curl_exec($ch), true);
$requestId = $data["requestId"];`,
};

const VERIFY_SAMPLES: Record<string, string> = {
  cURL: `curl -X POST ${BASE_URL}/otp/verify \\
  -H "x-api-key: watp_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "requestId": "otp_a1b2c3...",
    "code": "847293"
  }'

# Response (success):
# { "valid": true, "message": "OTP verified successfully" }

# Response (wrong code):
# { "valid": false, "message": "Invalid OTP code" }

# Response (expired):
# { "valid": false, "message": "OTP expired" }`,

  JavaScript: `const res = await fetch("${BASE_URL}/otp/verify", {
  method: "POST",
  headers: {
    "x-api-key": "watp_your_api_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    requestId: "otp_a1b2c3...", // from send response
    code: userEnteredCode,       // 6-digit code user typed
  }),
});

const { valid, message } = await res.json();

if (valid) {
  // ✅ User identity confirmed — log them in
  loginUser();
} else {
  // ❌ Wrong code, expired, or already used
  showError(message);
}`,

  Python: `response = requests.post(
    "${BASE_URL}/otp/verify",
    headers={
        "x-api-key": "watp_your_api_key_here",
        "Content-Type": "application/json",
    },
    json={"requestId": request_id, "code": user_code},
)
result = response.json()
if result["valid"]:
    login_user()`,

  PHP: `$ch = curl_init("${BASE_URL}/otp/verify");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["x-api-key: watp_your_api_key_here", "Content-Type: application/json"],
    CURLOPT_POSTFIELDS => json_encode(["requestId" => $requestId, "code" => $userCode]),
]);
$result = json_decode(curl_exec($ch), true);
if ($result["valid"]) loginUser();`,
};

const ERROR_CODES = [
  { code: 400, title: "Bad Request", desc: "Missing required fields or invalid format (e.g. bad phone number)." },
  { code: 401, title: "Unauthorized", desc: "Missing or invalid Bearer token / API key." },
  { code: 402, title: "Payment Required", desc: "No active subscription. Subscribe to a plan to send OTPs." },
  { code: 403, title: "Forbidden", desc: "Account suspended or insufficient permissions." },
  { code: 404, title: "Not Found", desc: "OTP request ID not found — check the requestId." },
  { code: 422, title: "Unprocessable", desc: "Sender number specified but it's not connected." },
  { code: 429, title: "Too Many Requests", desc: "Monthly OTP limit reached. Upgrade your plan." },
  { code: 503, title: "Service Unavailable", desc: "No WhatsApp numbers are connected on the platform." },
];

export default function Docs() {
  const [sendLang, setSendLang] = useState("JavaScript");
  const [verifyLang, setVerifyLang] = useState("JavaScript");
  const langs = ["cURL", "JavaScript", "Python", "PHP"];

  return (
    <div className="space-y-10 max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Documentation</h1>
          <p className="text-muted-foreground mt-1">Everything you need to integrate WhatsApp OTP into your app.</p>
        </div>
        <a href="/api/docs" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" /> Interactive API Explorer
          </Button>
        </a>
      </div>

      {/* Quick Start */}
      <Section id="quickstart" icon={<Zap className="h-5 w-5" />} title="Quick Start">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Integration takes under 5 minutes. Here's the complete flow:</p>
            <div className="grid gap-3">
              {[
                { n: "1", t: "Create account & subscribe", d: "Sign up, pick a plan, and get an active subscription." },
                { n: "2", t: "Generate an API key", d: 'Go to API Keys → "Create Key". Copy the key — it\'s shown only once.' },
                { n: "3", t: "Send an OTP", d: "POST to /api/otp/send with the destination phone number." },
                { n: "4", t: "Verify the code", d: "POST to /api/otp/verify with the requestId and the code your user entered." },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{n}</div>
                  <div>
                    <p className="font-semibold text-sm">{t}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Authentication */}
      <Section id="auth" icon={<Shield className="h-5 w-5" />} title="Authentication">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs font-mono">x-api-key</Badge>
                <span className="text-sm font-semibold">API Key Header (recommended for server-side)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Send your API key in the <code className="bg-muted px-1 py-0.5 rounded text-xs">x-api-key</code> request header. All API keys start with <code className="bg-muted px-1 py-0.5 rounded text-xs">watp_</code>.
              </p>
              <CodeBlock code={`curl -X POST ${BASE_URL}/otp/send \\
  -H "x-api-key: watp_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+2348012345678"}'`} />
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs font-mono">Authorization: Bearer</Badge>
                <span className="text-sm font-semibold">JWT Token (for dashboard/user sessions)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Also accepted for session-based flows. Obtain by calling <code className="bg-muted px-1 py-0.5 rounded text-xs">POST /api/auth/login</code>.
              </p>
              <CodeBlock code={`curl -H "Authorization: Bearer eyJhbGci..." ${BASE_URL}/auth/me`} />
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700">
                <strong>Keep your API key secret.</strong> Never expose it in frontend JavaScript, mobile apps, or public repos. Always call the API from your backend server.
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Base URL */}
      <Section id="baseurl" icon={<Globe className="h-5 w-5" />} title="Base URL & Headers">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid gap-3 text-sm">
              {[
                { k: "Base URL", v: BASE_URL },
                { k: "Content-Type", v: "application/json" },
                { k: "Auth header", v: "x-api-key: watp_your_key_here" },
                { k: "OTP expiry", v: "10 minutes from send time" },
                { k: "Code format", v: "6-digit numeric string" },
              ].map(({ k, v }) => (
                <div key={k} className="flex items-start gap-3">
                  <span className="font-medium w-36 flex-shrink-0 text-muted-foreground">{k}</span>
                  <code className="bg-muted rounded px-2 py-0.5 text-xs font-mono text-foreground">{v}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Send OTP */}
      <Section id="send" icon={<Code2 className="h-5 w-5" />} title="POST /otp/send — Send OTP">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <EndpointBadge method="POST" />
              <code className="text-sm font-mono">/api/otp/send</code>
            </div>
            <CardDescription>Sends a 6-digit OTP to the specified WhatsApp number. Returns a requestId used for verification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Request Body</p>
              <div className="rounded-lg border overflow-hidden text-sm">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Field</th>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Type</th>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Required</th>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { f: "phoneNumber", t: "string", r: "Yes", d: "Destination in E.164 format, e.g. +2348012345678" },
                      { f: "template", t: "string", r: "No", d: 'Custom message with {{code}} placeholder. Default: "Your AchekOTP code is: *{{code}}*"' },
                      { f: "senderNumberId", t: "integer", r: "No", d: "ID of a specific WhatsApp sender to use (must belong to your account or be a pool number)" },
                    ].map(({ f, t, r, d }) => (
                      <tr key={f}>
                        <td className="px-3 py-2 font-mono text-xs text-emerald-700">{f}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{t}</td>
                        <td className="px-3 py-2 text-xs">{r === "Yes" ? <span className="text-destructive font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Code Example</p>
              <Tabs value={sendLang} onValueChange={setSendLang}>
                <TabsList className="mb-2">{["cURL", "JavaScript", "Python", "PHP"].map(l => <TabsTrigger key={l} value={l}>{l}</TabsTrigger>)}</TabsList>
                {Object.entries(SEND_SAMPLES).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}><CodeBlock code={code} /></TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Verify OTP */}
      <Section id="verify" icon={<Code2 className="h-5 w-5" />} title="POST /otp/verify — Verify OTP">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <EndpointBadge method="POST" />
              <code className="text-sm font-mono">/api/otp/verify</code>
            </div>
            <CardDescription>Verify the 6-digit code your user entered. Each OTP can only be verified once.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Request Body</p>
              <div className="rounded-lg border overflow-hidden text-sm">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Field</th>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Type</th>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs text-emerald-700">requestId</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">string</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">The requestId returned by /otp/send</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs text-emerald-700">code</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">string</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">The 6-digit code entered by your user</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Code Example</p>
              <Tabs value={verifyLang} onValueChange={setVerifyLang}>
                <TabsList className="mb-2">{langs.map(l => <TabsTrigger key={l} value={l}>{l}</TabsTrigger>)}</TabsList>
                {Object.entries(VERIFY_SAMPLES).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}><CodeBlock code={code} /></TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Password Reset OTP */}
      <Section id="password-reset" icon={<Shield className="h-5 w-5" />} title="Password Reset via WhatsApp OTP">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Use these endpoints to implement "Forgot Password" in your own app — or use AchekOTP's built-in auth flow for your platform account.
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <EndpointBadge method="POST" />
                  <code className="text-sm font-mono">/api/auth/forgot-password</code>
                </div>
                <p className="text-xs text-muted-foreground">Send a reset OTP to a user's verified WhatsApp number. Body: <code className="bg-muted px-1 rounded">{"{ phoneNumber }"}</code></p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <EndpointBadge method="POST" />
                  <code className="text-sm font-mono">/api/auth/reset-password</code>
                </div>
                <p className="text-xs text-muted-foreground">Verify the OTP and set new password. Body: <code className="bg-muted px-1 rounded">{"{ phoneNumber, code, newPassword }"}</code></p>
              </div>
            </div>
            <CodeBlock code={`// Step 1: request reset
await fetch("${BASE_URL}/auth/forgot-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phoneNumber: "+2348012345678" }),
});

// Step 2: user receives OTP on WhatsApp, enters it in your app
await fetch("${BASE_URL}/auth/reset-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phoneNumber: "+2348012345678",
    code: "847293",
    newPassword: "NewSecurePassword123",
  }),
});`} lang="js" />
          </CardContent>
        </Card>
      </Section>

      {/* Error Codes */}
      <Section id="errors" icon={<AlertCircle className="h-5 w-5" />} title="Error Codes">
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-xs">Status</th>
                    <th className="text-left px-3 py-2 font-semibold text-xs">Meaning</th>
                    <th className="text-left px-3 py-2 font-semibold text-xs">What to do</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ERROR_CODES.map(({ code, title, desc }) => (
                    <tr key={code}>
                      <td className="px-3 py-2">
                        <span className={`font-mono font-bold text-xs ${code >= 500 ? "text-red-600" : code >= 400 ? "text-orange-600" : "text-blue-600"}`}>{code}</span>
                      </td>
                      <td className="px-3 py-2 font-semibold text-xs">{title}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Error Response Shape</p>
              <CodeBlock code={`// All error responses follow this format:
{
  "error": "Human-readable error message"
}

// Example:
{
  "error": "OTP limit reached for current billing period"
}`} />
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Rate Limits & Best Practices */}
      <Section id="limits" icon={<BookOpen className="h-5 w-5" />} title="Limits & Best Practices">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <p className="font-semibold text-sm mb-3">OTP Limits by Plan</p>
              <div className="rounded-lg border overflow-hidden text-sm">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold">Plan</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold">OTPs / Month</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold">Custom Number</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold">Branding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { name: "Free", otps: "10", custom: "No", brand: "AchekOTP branded" },
                      { name: "Starter", otps: "500", custom: "No", brand: "No branding" },
                      { name: "Growth", otps: "2,000", custom: "No", brand: "No branding" },
                      { name: "Business", otps: "10,000", custom: "Yes", brand: "No branding" },
                      { name: "Enterprise", otps: "50,000", custom: "Yes", brand: "No branding" },
                    ].map(({ name, otps, custom, brand }) => (
                      <tr key={name}>
                        <td className="px-3 py-2 font-medium text-xs">{name}</td>
                        <td className="px-3 py-2 text-xs">{otps}</td>
                        <td className="px-3 py-2 text-xs">{custom === "Yes" ? <span className="text-emerald-600">✓ Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{brand}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="font-semibold text-sm mb-3">Best Practices</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Always call the API from your backend server — never expose API keys in frontend code.",
                  "Store the requestId server-side and associate it with the user session for verification.",
                  "OTPs expire after 10 minutes and can only be verified once — handle both cases in your UI.",
                  "Use E.164 phone format (+country code + number, no spaces) for reliable delivery.",
                  "Set a custom template to match your brand — keep it short and include the {{code}} placeholder.",
                  "Implement retry logic with exponential backoff for 503 errors (no sender available).",
                  "Monitor your OTP success rate in the dashboard — low rates often mean phone numbers aren't on WhatsApp.",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold flex-shrink-0">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
