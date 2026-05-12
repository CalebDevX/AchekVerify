import { useEffect, useState } from "react";

const WHATSAPP_GREEN = "#25D366";
const WA_DARK = "#075E54";

function ChatBubble({ msg, delay }: { msg: { from: "business" | "user"; text: string; sub?: string }; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!show) return null;

  return (
    <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} animate-[fadeInUp_0.35s_ease]`}>
      <div
        className="max-w-[260px] rounded-2xl px-4 py-3 shadow-sm"
        style={{ background: msg.from === "business" ? "#fff" : WHATSAPP_GREEN }}
      >
        {msg.from === "business" && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-[8px] font-bold" style={{ color: WA_DARK }}>F</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: WA_DARK }}>FlutterPay</span>
            <svg className="w-3 h-3 text-green-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
        )}
        <p className={`text-sm leading-relaxed ${msg.from === "user" ? "text-white" : "text-gray-800"}`}>{msg.text}</p>
        {msg.sub && <p className="text-xs text-gray-400 mt-1">{msg.sub}</p>}
        <p className={`text-[10px] text-right mt-1 ${msg.from === "user" ? "text-green-100" : "text-gray-400"}`}>
          just now {msg.from === "user" ? "✓✓" : ""}
        </p>
      </div>
    </div>
  );
}

const CONVERSATION = [
  { from: "business" as const, text: "Hi Amaka! Your FlutterPay verification code is:\n\n🔐 592 847\n\nExpires in 10 minutes.", sub: "Do not share this code." },
  { from: "user" as const, text: "Got it, entering now! 👍" },
];

export function LightTrust() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes countUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* nav */}
      <nav className="bg-white border-b border-gray-100 px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: WHATSAPP_GREEN }}>
            <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z"/><path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.48-8.45zm-8.475 18.301h-.004c-1.775 0-3.514-.477-5.031-1.378l-.361-.214-3.741.975.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.892 6.993c-.003 5.45-4.437 9.884-9.885 9.884z"/></svg>
          </div>
          <span className="font-bold text-gray-900 text-base">WhatOTP</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <span className="hover:text-gray-900 cursor-pointer">Pricing</span>
          <span className="hover:text-gray-900 cursor-pointer">Docs</span>
          <button className="text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Log in</button>
          <button
            className="text-white font-semibold px-5 py-2 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${WHATSAPP_GREEN}, #128C7E)` }}
          >
            Start for free
          </button>
        </div>
      </nav>

      {/* hero */}
      <div className="flex-1 flex items-center max-w-6xl mx-auto px-10 py-12 w-full gap-16">
        {/* left */}
        <div className="flex-1 max-w-lg">
          {/* trust badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex -space-x-2">
              {["#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white" style={{ background: c }} />
              ))}
            </div>
            <span className="text-sm text-gray-600"><strong className="text-gray-900">500+</strong> Nigerian devs use WhatOTP</span>
          </div>

          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Send WhatsApp OTPs{" "}
            <span style={{ color: WHATSAPP_GREEN }}>your users</span>{" "}
            actually see
          </h1>

          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            WhatsApp open rates are <strong className="text-gray-800">98%</strong>. SMS is 20%. Stop losing signups to unread verification codes.
          </p>

          <div className="flex gap-3 mb-10">
            <button
              className="text-white font-bold px-7 py-3.5 rounded-xl text-sm shadow-lg hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${WHATSAPP_GREEN}, #128C7E)` }}
            >
              Get started free →
            </button>
            <button className="text-gray-600 border border-gray-200 bg-white px-6 py-3.5 rounded-xl text-sm hover:border-gray-300 transition-colors">
              See the docs
            </button>
          </div>

          {/* proof metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "98%", label: "Open rate", sub: "vs 20% SMS" },
              { value: "< 2s", label: "Delivery", sub: "avg response" },
              { value: "10×", label: "Cheaper", sub: "than SMS" },
            ].map(({ value, label, sub }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="text-2xl font-extrabold text-gray-900" style={{ color: value === "98%" ? WHATSAPP_GREEN : undefined }}>{value}</div>
                <div className="text-xs font-semibold text-gray-700 mt-0.5">{label}</div>
                <div className="text-xs text-gray-400">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* right — WhatsApp chat mockup */}
        <div className="flex-1 flex justify-center">
          <div className="w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: WA_DARK }}>
              <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center font-bold text-sm" style={{ color: WA_DARK }}>F</div>
              <div>
                <div className="text-white font-semibold text-sm">FlutterPay</div>
                <div className="text-green-200 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                  Verified Business ✓
                </div>
              </div>
            </div>
            {/* chat area */}
            <div className="p-4 space-y-3" style={{ background: "#ECE5DD", minHeight: "280px" }}>
              {CONVERSATION.map((msg, i) => (
                <ChatBubble key={i} msg={msg} delay={i * 1400 + 400} />
              ))}
            </div>
            {/* input bar */}
            <div className="px-3 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-400 border border-gray-200">Type a message</div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: WHATSAPP_GREEN }}>
                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
