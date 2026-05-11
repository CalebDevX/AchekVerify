import { useState } from "react";
import { Link } from "wouter";
import { useListPlans } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronUp, Terminal, Zap, ShieldCheck, Clock, Globe, Smartphone, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CODE_TABS = ["cURL", "JavaScript", "Python", "PHP"] as const;
type CodeTab = typeof CODE_TABS[number];

const CODE_SAMPLES: Record<CodeTab, { send: string; verify: string }> = {
  cURL: {
    send: `curl -X POST https://yourapp.com/api/otp/send \\
  -H "X-API-Key: watp_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+2348012345678"}'

# Response:
# { "requestId": "req_abc123", "message": "OTP sent" }`,
    verify: `curl -X POST https://yourapp.com/api/otp/verify \\
  -H "X-API-Key: watp_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"requestId": "req_abc123", "code": "847293"}'

# Response:
# { "valid": true }`,
  },
  JavaScript: {
    send: `const apiKey = "watp_live_xxxxxxxxxxxx";

async function sendOTP(phoneNumber) {
  const res = await fetch("/api/otp/send", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phoneNumber }),
  });
  const { requestId } = await res.json();
  return requestId; // save this for verification
}

const requestId = await sendOTP("+2348012345678");`,
    verify: `async function verifyOTP(requestId, code) {
  const res = await fetch("/api/otp/verify", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requestId, code }),
  });
  const { valid } = await res.json();
  return valid; // true = correct code
}

const isValid = await verifyOTP(requestId, userInput);
if (isValid) loginUser();`,
  },
  Python: {
    send: `import requests

API_KEY = "watp_live_xxxxxxxxxxxx"

def send_otp(phone_number):
    response = requests.post(
        "https://yourapp.com/api/otp/send",
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
        },
        json={"phoneNumber": phone_number},
    )
    data = response.json()
    return data["requestId"]  # save for verification

request_id = send_otp("+2348012345678")`,
    verify: `def verify_otp(request_id, code):
    response = requests.post(
        "https://yourapp.com/api/otp/verify",
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
        },
        json={"requestId": request_id, "code": code},
    )
    data = response.json()
    return data["valid"]  # True = correct code

is_valid = verify_otp(request_id, user_input)
if is_valid:
    login_user()`,
  },
  PHP: {
    send: `<?php
$apiKey = "watp_live_xxxxxxxxxxxx";

function sendOTP($phoneNumber) {
    global $apiKey;
    $ch = curl_init("https://yourapp.com/api/otp/send");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "X-API-Key: $apiKey",
            "Content-Type: application/json",
        ],
        CURLOPT_POSTFIELDS => json_encode([
            "phoneNumber" => $phoneNumber
        ]),
    ]);
    $result = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $result["requestId"];
}

$requestId = sendOTP("+2348012345678");`,
    verify: `function verifyOTP($requestId, $code) {
    global $apiKey;
    $ch = curl_init("https://yourapp.com/api/otp/verify");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "X-API-Key: $apiKey",
            "Content-Type: application/json",
        ],
        CURLOPT_POSTFIELDS => json_encode([
            "requestId" => $requestId,
            "code" => $code
        ]),
    ]);
    $result = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $result["valid"];
}

$isValid = verifyOTP($requestId, $userCode);
if ($isValid) loginUser();`,
  },
};

const FAQS = [
  {
    q: "How quickly does the OTP get delivered?",
    a: "Most OTPs arrive within 2–5 seconds. WhatsApp uses internet-based delivery, so there's no carrier delay or SMS routing. As long as the recipient has an internet connection, delivery is near-instant.",
  },
  {
    q: "Do I need a WhatsApp Business account?",
    a: "Not on the Starter or Growth plans. We provide shared Nigerian WhatsApp numbers from our pool. On Business and Enterprise plans, you can connect your own dedicated WhatsApp number for a branded experience.",
  },
  {
    q: "Can users outside Nigeria receive OTPs?",
    a: "Yes. Any active WhatsApp account worldwide can receive OTPs. The phone number just needs to be registered on WhatsApp. Our plans support Nigerian, UK, and US numbers as the sender.",
  },
  {
    q: "How does the Free plan work?",
    a: 'The Free plan gives you 10 OTPs per month to try the API. Messages will include "via WhatOTP" branding. When you are ready to go live or need more volume, upgrade to any paid plan.',
  },
  {
    q: "How is billing handled?",
    a: "We use Paystack for secure NGN billing. All paid plans are billed monthly in Nigerian Naira. You can upgrade or cancel at any time from your dashboard.",
  },
  {
    q: "Is the API secure?",
    a: "Yes. API keys are bcrypt-hashed and only shown once at creation. All requests require your unique API key. OTP codes expire after 10 minutes and can only be verified once.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="flex w-full items-center justify-between py-5 text-left text-gray-900 font-medium hover:text-emerald-700 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="h-5 w-5 text-emerald-600 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />}
      </button>
      {open && <p className="pb-5 text-gray-600 leading-relaxed text-sm">{a}</p>}
    </div>
  );
}

export default function Landing() {
  const { data: plans, isLoading } = useListPlans();
  const [activeTab, setActiveTab] = useState<CodeTab>("JavaScript");
  const [codeView, setCodeView] = useState<"send" | "verify">("send");

  const monthlyPlans = plans?.filter((p) => p.period === "monthly") ?? [];

  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(0,0,0,0))]" />
        <div className="relative container mx-auto max-w-7xl px-4 md:px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-sm text-emerald-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Now with Free plan — no credit card required
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Nigeria's most reliable{" "}
              <span className="text-emerald-400">WhatsApp OTP</span> API
            </h1>
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl">
              Replace expensive SMS with WhatsApp verification. 10× cheaper, real-time delivery, and less than 5 minutes to integrate. Trusted by Nigerian developers and businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white h-12 px-8 text-base font-semibold w-full sm:w-auto">
                  Start free — no card needed
                </Button>
              </Link>
              <a href="#integrate">
                <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 hover:border-gray-600 h-12 px-8 text-base w-full sm:w-auto">
                  <Terminal className="mr-2 h-4 w-4" /> View integration docs
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-gray-800">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-800">
              {[
                { label: "OTPs sent today", value: "50,000+" },
                { label: "Delivery rate", value: "99.2%" },
                { label: "Avg delivery time", value: "< 3s" },
                { label: "Developer signups", value: "2,400+" },
              ].map((s) => (
                <div key={s.label} className="py-6 px-4 md:px-8 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Setup in under 5 minutes</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How WhatOTP works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" />
            {[
              {
                step: "01",
                icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
                title: "Create account & get your API key",
                desc: "Sign up for free, head to your dashboard, and generate an API key in one click. No forms to fill, no waiting for approval.",
              },
              {
                step: "02",
                icon: <Smartphone className="h-6 w-6 text-emerald-600" />,
                title: "Send an OTP with one request",
                desc: "Call our API with your user's phone number. We route the OTP through WhatsApp and return a requestId you use for verification.",
              },
              {
                step: "03",
                icon: <Zap className="h-6 w-6 text-emerald-600" />,
                title: "Verify the code your user enters",
                desc: "Pass the requestId and the code your user typed. We return { valid: true } or false. That's the whole integration.",
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-emerald-100 rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-4xl font-black text-gray-100 leading-none select-none">{item.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTEGRATION GUIDE ─── */}
      <section id="integrate" className="py-20 md:py-28 bg-gray-950 text-white">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-3">Developer docs</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-5">Integrate in minutes, not days</h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                Two endpoints. One API key. We designed the simplest possible interface so you can add WhatsApp OTP to any stack — React, Vue, Django, Laravel, Express — in minutes.
              </p>
              <div className="space-y-4">
                {[
                  { title: "Base URL", val: "https://yourapp.com/api" },
                  { title: "Auth header", val: "X-API-Key: watp_live_xxx" },
                  { title: "Send OTP", val: "POST /otp/send" },
                  { title: "Verify OTP", val: "POST /otp/verify" },
                ].map((r) => (
                  <div key={r.title} className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">{r.title}: </span>
                      <code className="text-emerald-300 text-sm font-mono">{r.val}</code>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/register">
                  <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">Get your free API key</Button>
                </Link>
              </div>
            </div>

            <div>
              {/* Tab bar */}
              <div className="flex items-center gap-1 bg-gray-900 rounded-t-xl px-3 pt-3 border border-gray-800 border-b-0">
                {CODE_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-gray-800 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <div className="ml-auto flex gap-1">
                  {(["send", "verify"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setCodeView(v)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        codeView === v
                          ? "bg-emerald-600 text-white"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {v === "send" ? "Send OTP" : "Verify OTP"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Code block */}
              <div className="bg-gray-900 rounded-b-xl border border-gray-800 border-t-0 overflow-hidden">
                <pre className="p-5 text-xs leading-relaxed text-gray-300 font-mono overflow-x-auto whitespace-pre">
                  <code>{CODE_SAMPLES[activeTab][codeView]}</code>
                </pre>
              </div>

              {/* Callout */}
              <div className="mt-4 bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex gap-3">
                <Zap className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">That's literally it</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    No SDK to install, no webhooks required for basic flow. Just two REST calls and your users are verified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY WHATOTP ─── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Why developers choose us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Built for Nigeria, works everywhere</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe className="h-6 w-6 text-emerald-600" />,
                title: "10× cheaper than SMS",
                desc: "Stop paying ₦10–₦50 per SMS that gets stuck in carrier routing. WhatsApp OTPs cost a fraction of the price.",
              },
              {
                icon: <Zap className="h-6 w-6 text-emerald-600" />,
                title: "Delivery in under 3 seconds",
                desc: "Internet-based delivery bypasses Nigerian carrier congestion. OTPs land fast, even during peak hours.",
              },
              {
                icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
                title: "Codes expire automatically",
                desc: "Every OTP expires after 10 minutes and can only be used once. Zero replay attack risk.",
              },
              {
                icon: <Smartphone className="h-6 w-6 text-emerald-600" />,
                title: "Your own WhatsApp number",
                desc: "Business plan users can connect their own WhatsApp number so OTPs arrive from your brand, not a shared pool.",
              },
              {
                icon: <Star className="h-6 w-6 text-emerald-600" />,
                title: "Custom display name",
                desc: "Business and Enterprise users can request a custom WhatsApp display name for a fully branded experience.",
              },
              {
                icon: <Clock className="h-6 w-6 text-emerald-600" />,
                title: "Full delivery logs",
                desc: "Every OTP request is logged. See what was sent, when, and whether it was verified — all from your dashboard.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 p-7 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Transparent pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Start free, scale as you grow</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              All prices in Nigerian Naira (₦). Billed monthly. No hidden fees. Upgrade or cancel any time.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6">
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-8 w-28 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {monthlyPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl flex flex-col border ${
                    plan.popular
                      ? "bg-emerald-700 border-emerald-600 text-white shadow-xl shadow-emerald-900/20 scale-[1.02]"
                      : "bg-white border-gray-200 text-gray-900"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <span className="bg-emerald-400 text-emerald-950 text-xs font-bold px-3 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="p-6 flex-1">
                    <p className={`font-bold text-base mb-1 ${plan.popular ? "text-white" : "text-gray-900"}`}>
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-extrabold">Free</span>
                      ) : (
                        <>
                          <span className="text-2xl font-extrabold">₦{plan.price.toLocaleString("en-NG")}</span>
                          <span className={`text-xs ${plan.popular ? "text-emerald-200" : "text-gray-400"}`}>/mo</span>
                        </>
                      )}
                    </div>
                    <p className={`text-xs mb-5 ${plan.popular ? "text-emerald-200" : "text-gray-400"}`}>
                      {plan.otpLimit.toLocaleString()} OTPs/month
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${plan.popular ? "text-emerald-300" : "text-emerald-600"}`} />
                          <span className={plan.popular ? "text-emerald-100" : "text-gray-600"}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 pt-0">
                    <Link href="/register" className="block">
                      <button
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          plan.popular
                            ? "bg-white text-emerald-700 hover:bg-emerald-50"
                            : plan.price === 0
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "border border-gray-200 text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                      >
                        {plan.price === 0 ? "Get started free" : "Choose plan"}
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-sm text-gray-400 mt-8">
            Not sure which plan? Start with Free and upgrade any time. Enterprise volume or annual pricing?{" "}
            <a href="mailto:hello@whatotp.com" className="text-emerald-600 hover:underline">Talk to us.</a>
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Got questions?</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl px-6">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="bg-emerald-700 py-20">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to replace SMS?
          </h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of Nigerian developers already sending WhatsApp OTPs at a fraction of the SMS cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 h-12 px-10 font-semibold text-base">
                Start for free
              </Button>
            </Link>
            <a href="#integrate">
              <Button size="lg" variant="outline" className="border-emerald-300 text-white hover:bg-emerald-600 h-12 px-10 text-base">
                Read the docs
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
