import { useEffect, useState } from "react";

const COMPANIES = [
  { name: "Kuda", color: "#7B3FE4", bg: "#1a0a2e", abbr: "K" },
  { name: "Cowrywise", color: "#00C795", bg: "#002a1f", abbr: "C" },
  { name: "Piggyvest", color: "#10B981", bg: "#052e16", abbr: "P" },
  { name: "Flutterwave", color: "#F5A623", bg: "#2a1900", abbr: "F" },
  { name: "Paystack", color: "#011B33", bg: "#e8f5ff", abbr: "PS" },
  { name: "Brass", color: "#4F46E5", bg: "#1e1b4b", abbr: "B" },
  { name: "Carbon", color: "#00C2A8", bg: "#002a26", abbr: "C" },
  { name: "Moniepoint", color: "#2563EB", bg: "#1e3a8a", abbr: "M" },
];

const ACTIVITIES = [
  "Abuja, NG — Fintech startup integrated WhatOTP",
  "Lagos, NG — Dev switched from Termii SMS",
  "Port Harcourt, NG — E-commerce app went live",
  "Kano, NG — Logistics platform added verification",
  "Ibadan, NG — Healthtech startup started free trial",
  "Enugu, NG — Payment app reduced OTP costs by 87%",
];

function LiveCounter() {
  const [count, setCount] = useState(2417);
  const [activityIdx, setActivityIdx] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const bump = Math.random() > 0.5 ? 1 : 0;
      if (bump) {
        setCount(c => c + 1);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
        setActivityIdx(i => (i + 1) % ACTIVITIES.length);
      }
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="text-6xl font-black tabular-nums transition-all duration-300"
        style={{ color: "#10B981", textShadow: pulse ? "0 0 30px rgba(16,185,129,0.8)" : "none" }}
      >
        {count.toLocaleString()}+
      </div>
      <div className="text-gray-400 text-sm font-medium">Nigerian developers & businesses</div>
      <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-full px-4 py-2 text-xs text-gray-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="truncate max-w-[260px]">{ACTIVITIES[activityIdx]}</span>
      </div>
    </div>
  );
}

export function LogosCounter() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* nav */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">W</div>
          <span className="text-white font-semibold text-sm">WhatOTP</span>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg">Start free</button>
      </nav>

      {/* hero */}
      <div className="text-center py-16 px-10">
        <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">Trusted by Nigerian builders</p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          The OTP layer powering<br />Nigeria's fastest-growing apps
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          From solo devs to funded fintechs — teams choose WhatOTP to stop paying for SMS that users never read.
        </p>
      </div>

      {/* live counter */}
      <div className="flex justify-center mb-12">
        <LiveCounter />
      </div>

      {/* logo marquee */}
      <div className="overflow-hidden mb-6 relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-gray-950 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-gray-950 to-transparent" />
        <div className="flex gap-4" style={{ animation: "marquee 22s linear infinite", width: "max-content" }}>
          {[...COMPANIES, ...COMPANIES].map((co, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-800 bg-gray-900 flex-shrink-0"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: co.bg, color: co.color, border: `1.5px solid ${co.color}33` }}
              >
                {co.abbr}
              </div>
              <span className="text-white text-sm font-semibold whitespace-nowrap">{co.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* second row — slower, opposite direction */}
      <div className="overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-gray-950 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-gray-950 to-transparent" />
        <div
          className="flex gap-4"
          style={{ animation: "marquee 30s linear infinite reverse", width: "max-content" }}
        >
          {[...COMPANIES.slice(4), ...COMPANIES.slice(0, 4), ...COMPANIES.slice(4), ...COMPANIES.slice(0, 4)].map((co, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-800 bg-gray-900 flex-shrink-0"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: co.bg, color: co.color, border: `1.5px solid ${co.color}33` }}
              >
                {co.abbr}
              </div>
              <span className="text-white text-sm font-semibold whitespace-nowrap">{co.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* bottom CTA */}
      <div className="text-center py-12 mt-auto">
        <p className="text-gray-500 text-sm mb-4">Join them — free plan, no credit card.</p>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors">
          Get your API key →
        </button>
      </div>
    </div>
  );
}
