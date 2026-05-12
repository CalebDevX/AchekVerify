import { useEffect, useState } from "react";

const API_CODE = `POST /api/otp/send
X-API-Key: watp_live_xxxxxx
Content-Type: application/json

{
  "phoneNumber": "+2348012345678"
}

← 200 OK
{
  "requestId": "req_abc123",
  "message": "OTP sent via WhatsApp"
}`;

function TypewriterCode({ code }: { code: string }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx < code.length) {
      const t = setTimeout(() => {
        setDisplayed(code.slice(0, idx + 1));
        setIdx(idx + 1);
      }, idx < 50 ? 28 : idx < 100 ? 18 : 8);
      return () => clearTimeout(t);
    }
  }, [idx, code]);

  return (
    <pre className="text-xs leading-relaxed font-mono text-emerald-300 whitespace-pre-wrap">
      {displayed}
      <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
    </pre>
  );
}

function MiniPhone() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 3800);
    const t2 = setTimeout(() => setStep(2), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="w-[180px] h-[360px] rounded-[32px] border-[5px] border-neutral-600 bg-neutral-900 overflow-hidden shadow-2xl flex flex-col relative">
      <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-emerald-400 text-[8px] font-bold text-white flex items-center justify-center">A</div>
        <div>
          <div className="text-white text-[9px] font-semibold">Acme Bank</div>
          <div className="text-emerald-200 text-[7px]">via WhatOTP</div>
        </div>
      </div>
      <div className="flex-1 bg-[#0a1a0f] p-2 space-y-2">
        {step >= 1 && (
          <div className="bg-[#1a2a1f] rounded-lg rounded-tl-none px-2 py-1.5 max-w-[140px] animate-[fadeInUp_0.4s_ease]">
            <p className="text-[8px] text-neutral-300">Your OTP code is:</p>
            <p className="text-emerald-400 text-sm font-bold tracking-widest mt-1">847 293</p>
            <p className="text-[7px] text-neutral-500 mt-1">Valid 10 minutes ✓✓</p>
          </div>
        )}
        {step === 0 && (
          <div className="text-neutral-600 text-[8px] text-center mt-8">Waiting for API call...</div>
        )}
      </div>
      {step >= 2 && (
        <div className="absolute bottom-3 right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-[popIn_0.3s_ease]">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function ApiSplit() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      {/* nav */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <span className="text-white font-semibold text-sm">WhatOTP</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-neutral-400">
          <span>How it works</span>
          <span>Pricing</span>
          <span>Docs</span>
          <button className="border border-neutral-600 text-neutral-300 px-4 py-1.5 rounded-lg mr-2">Log in</button>
          <button className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-medium">Start free</button>
        </div>
      </nav>

      {/* hero — split */}
      <div className="flex-1 flex">
        {/* left — developer side */}
        <div className="flex-1 bg-neutral-950 flex flex-col justify-center px-10 py-12 border-r border-neutral-800">
          <div className="text-emerald-500 text-xs font-mono font-medium uppercase tracking-wider mb-3">Developer side</div>
          <h2 className="text-white text-3xl font-bold mb-2">2 API calls.</h2>
          <p className="text-neutral-500 text-sm mb-8">Send OTP. Verify OTP. That's it.</p>

          {/* terminal */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 overflow-hidden shadow-xl">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="ml-2 text-neutral-500 text-xs font-mono">WhatOTP API</span>
            </div>
            <div className="p-5 min-h-[220px]">
              <TypewriterCode code={API_CODE} />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Get API key free
            </button>
            <button className="border border-neutral-700 text-neutral-400 text-sm px-5 py-2.5 rounded-lg">
              View docs →
            </button>
          </div>
        </div>

        {/* right — user side */}
        <div className="flex-1 bg-[#030f08] flex flex-col justify-center items-center px-10 py-12 relative overflow-hidden">
          {/* background pattern */}
          <div className="absolute inset-0 opacity-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="absolute w-px h-full bg-emerald-400" style={{ left: `${i * 14.3}%` }} />
            ))}
          </div>
          <div className="text-emerald-500 text-xs font-mono font-medium uppercase tracking-wider mb-3 relative z-10">User side</div>
          <h2 className="text-white text-3xl font-bold mb-2 relative z-10">One verified user.</h2>
          <p className="text-neutral-500 text-sm mb-8 relative z-10">WhatsApp message arrives in under 2 seconds.</p>

          <div className="relative z-10">
            <MiniPhone />
          </div>

          <div className="mt-8 text-center relative z-10">
            <div className="text-neutral-600 text-xs">Trusted by 500+ Nigerian businesses</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
              <span className="text-neutral-400 text-xs ml-1">4.9/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
