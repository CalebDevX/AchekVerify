import { useEffect, useState } from "react";

const MESSAGES = [
  { from: "system", text: "Welcome to Kuda Bank", time: "9:41" },
  { from: "otp", text: "Your WhatOTP code is:\n\n🔐 847 293\n\nValid for 10 minutes. Do not share.", time: "9:41" },
];

function PhoneMockup() {
  const [visible, setVisible] = useState(0);
  const [dotAnim, setDotAnim] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDotAnim(true), 900);
    const t2 = setTimeout(() => { setDotAnim(false); setVisible(1); }, 2200);
    const t3 = setTimeout(() => setVisible(2), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (visible === 2) {
      const id = setTimeout(() => setVisible(0), 4000);
      return () => clearTimeout(id);
    }
    if (visible === 0) {
      const id = setTimeout(() => {
        setVisible(0);
        setDotAnim(false);
        const t1 = setTimeout(() => setDotAnim(true), 900);
        const t2 = setTimeout(() => { setDotAnim(false); setVisible(1); }, 2200);
        const t3 = setTimeout(() => setVisible(2), 3200);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
      }, 600);
      return () => clearTimeout(id);
    }
  }, [visible]);

  return (
    <div className="relative w-[260px] h-[520px] flex-shrink-0">
      {/* glow */}
      <div className="absolute inset-0 rounded-[44px] blur-2xl opacity-25 bg-emerald-500 scale-110" />
      {/* phone body */}
      <div className="relative w-full h-full rounded-[44px] border-[7px] border-neutral-700 bg-neutral-900 overflow-hidden shadow-2xl">
        {/* status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-white text-[10px] font-semibold">9:41</span>
          <div className="w-20 h-4 bg-neutral-800 rounded-full" />
          <div className="flex gap-1 items-center">
            <div className="w-3 h-2 rounded-sm border border-neutral-400">
              <div className="w-2 h-full bg-neutral-400 rounded-sm" />
            </div>
          </div>
        </div>
        {/* chat header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#075E54]">
          <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-xs font-bold text-white">K</div>
          <div>
            <div className="text-white text-xs font-semibold">Kuda Bank</div>
            <div className="text-emerald-200 text-[9px]">via WhatOTP</div>
          </div>
        </div>
        {/* chat area */}
        <div
          className="flex-1 px-3 py-3 space-y-2 overflow-hidden"
          style={{ background: "#0a1a0f", minHeight: "360px" }}
        >
          {visible >= 1 && (
            <div className="flex justify-start animate-[fadeIn_0.3s_ease]">
              <div className="bg-[#1a2a1f] rounded-lg rounded-tl-none px-3 py-2 max-w-[200px] shadow">
                <p className="text-[10px] text-neutral-300">{MESSAGES[0].text}</p>
                <p className="text-[8px] text-neutral-500 text-right mt-1">{MESSAGES[0].time}</p>
              </div>
            </div>
          )}

          {dotAnim && (
            <div className="flex justify-start">
              <div className="bg-[#1a2a1f] rounded-lg rounded-tl-none px-3 py-2 shadow">
                <div className="flex gap-1 items-center h-3">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {visible >= 2 && (
            <div className="flex justify-start animate-[fadeIn_0.4s_ease]">
              <div className="bg-[#1a2a1f] border border-emerald-900 rounded-lg rounded-tl-none px-3 py-2 max-w-[200px] shadow">
                <p className="text-[10px] text-neutral-200 whitespace-pre-line leading-relaxed">{MESSAGES[1].text}</p>
                <p className="text-[8px] text-neutral-500 text-right mt-1">{MESSAGES[1].time} ✓✓</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* notification badge */}
      {visible >= 2 && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center animate-[popIn_0.3s_cubic-bezier(0.36,0.07,0.19,0.97)]">
          1
        </div>
      )}
    </div>
  );
}

export function PhoneAlive() {
  return (
    <div className="min-h-screen bg-[#030f08] flex flex-col">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.6); opacity: 0; } }
      `}</style>
      {/* nav */}
      <nav className="flex items-center justify-between px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <span className="text-white font-semibold text-sm">WhatOTP</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-neutral-400 text-sm">Pricing</span>
          <span className="text-neutral-400 text-sm">Docs</span>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
            Start free
          </button>
        </div>
      </nav>

      {/* hero */}
      <div className="flex-1 flex items-center justify-between max-w-6xl mx-auto px-10 py-10 w-full gap-12">
        {/* left */}
        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Now with Free plan — no credit card required
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Nigeria's most reliable{" "}
            <span className="text-emerald-400">WhatsApp OTP</span> API
          </h1>
          <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
            Replace expensive SMS with WhatsApp verification. 10× cheaper, real-time delivery, and less than 5 minutes to integrate.
          </p>
          <div className="flex gap-3 mb-10">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Start free — no card needed
            </button>
            <button className="border border-neutral-700 text-neutral-300 hover:border-neutral-500 font-medium px-6 py-3 rounded-xl transition-colors text-sm">
              &gt;_ View integration docs
            </button>
          </div>
          {/* stats */}
          <div className="flex gap-8">
            {[["500+", "Developers"], ["99.9%", "Uptime"], ["&lt;2s", "Delivery"]].map(([val, label]) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white" dangerouslySetInnerHTML={{ __html: val }} />
                <div className="text-neutral-500 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* right — live phone */}
        <div className="flex flex-col items-center gap-6 relative">
          {/* pulse rings behind phone */}
          <div className="relative">
            <div className="absolute inset-0 m-auto w-40 h-40 rounded-full border border-emerald-700 opacity-30" style={{ animation: "pulseRing 2.5s ease-out infinite" }} />
            <div className="absolute inset-0 m-auto w-40 h-40 rounded-full border border-emerald-600 opacity-20" style={{ animation: "pulseRing 2.5s ease-out 1.2s infinite" }} />
            <PhoneMockup />
          </div>
          <div className="text-center">
            <div className="text-emerald-400 text-xs font-medium uppercase tracking-wider">Live preview</div>
            <div className="text-neutral-500 text-xs mt-1">OTP arriving in real-time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
