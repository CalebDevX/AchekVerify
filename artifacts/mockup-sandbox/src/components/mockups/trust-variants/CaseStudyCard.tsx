const BEFORE = [
  { item: "SMS provider", sms: "Termii", wa: "WhatOTP" },
  { item: "Cost per OTP", sms: "₦14.50", wa: "₦1.80" },
  { item: "Monthly OTPs", sms: "180,000", wa: "180,000" },
  { item: "Monthly cost", sms: "₦2,610,000", wa: "₦324,000" },
  { item: "Delivery rate", sms: "76%", wa: "99.3%" },
  { item: "Avg delivery time", sms: "8.4s", wa: "1.7s" },
];

const METRICS = [
  { value: "₦2.28M", label: "Saved per month", sub: "vs Termii SMS", color: "#10B981" },
  { value: "31%", label: "More completions", sub: "verification flow lift", color: "#3B82F6" },
  { value: "14 min", label: "To integrate", sub: "backend + frontend", color: "#8B5CF6" },
];

export function CaseStudyCard() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* nav */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">W</div>
          <span className="text-white font-semibold text-sm">WhatOTP</span>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg">Start free</button>
      </nav>

      <div className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        {/* section label */}
        <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-8 text-center">Customer story</p>

        {/* card */}
        <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden">
          {/* card top bar */}
          <div className="bg-gradient-to-r from-emerald-950 via-gray-900 to-gray-900 border-b border-gray-800 px-8 py-6 flex items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#F5A623] flex items-center justify-center font-black text-gray-900 text-sm">FP</div>
                <div>
                  <div className="text-white font-bold text-lg leading-tight">FlutterPay</div>
                  <div className="text-gray-400 text-xs">Payments & Transfers · Lagos, Nigeria</div>
                </div>
              </div>
              <h2 className="text-white text-2xl font-extrabold leading-snug max-w-md">
                How FlutterPay cut OTP costs by{" "}
                <span className="text-emerald-400">87%</span>{" "}
                and verified more users
              </h2>
            </div>
            <div className="flex-shrink-0 hidden md:block">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-4 text-center">
                <div className="text-3xl font-black text-emerald-400">₦2.28M</div>
                <div className="text-emerald-300 text-xs font-medium mt-1">saved every month</div>
              </div>
            </div>
          </div>

          {/* metrics strip */}
          <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
            {METRICS.map(({ value, label, sub, color }) => (
              <div key={label} className="px-6 py-5 text-center">
                <div className="text-2xl font-extrabold mb-0.5" style={{ color }}>{value}</div>
                <div className="text-gray-300 text-xs font-semibold">{label}</div>
                <div className="text-gray-600 text-[10px] mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-0 divide-x divide-gray-800">
            {/* cost comparison table */}
            <div className="p-7">
              <h3 className="text-gray-300 font-semibold text-sm mb-4">Before vs After</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left pb-2 font-medium"></th>
                    <th className="text-center pb-2 font-medium">SMS</th>
                    <th className="text-center pb-2 font-medium text-emerald-400">WhatsApp OTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {BEFORE.map(({ item, sms, wa }) => (
                    <tr key={item}>
                      <td className="py-2.5 text-gray-500 text-xs">{item}</td>
                      <td className="py-2.5 text-center text-gray-400 text-xs font-mono">{sms}</td>
                      <td className="py-2.5 text-center text-xs font-mono font-semibold text-emerald-400">{wa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* quote + context */}
            <div className="p-7 flex flex-col justify-between">
              {/* quote */}
              <div>
                <svg className="w-8 h-8 text-emerald-800 fill-current mb-3" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-gray-200 text-sm leading-relaxed mb-4 italic">
                  "We were skeptical about moving core auth to a WhatsApp layer. Three months in, our OTP completion rate is the highest it's ever been and our infra cost dropped by six figures per month. The API is exactly as simple as they say."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#7B3FE4] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AO</div>
                  <div>
                    <div className="text-white text-sm font-semibold">Akin Okonkwo</div>
                    <div className="text-gray-500 text-xs">CTO, FlutterPay</div>
                  </div>
                </div>
              </div>

              {/* code snippet */}
              <div className="mt-6 bg-gray-950 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="ml-2 text-gray-600 text-[10px] font-mono">integration.js</span>
                </div>
                <pre className="text-[10px] font-mono leading-relaxed">
                  <span className="text-purple-400">const</span>
                  <span className="text-white"> res </span>
                  <span className="text-gray-500">= </span>
                  <span className="text-blue-400">await </span>
                  <span className="text-yellow-300">fetch</span>
                  <span className="text-white">(</span>
                  <span className="text-green-300">"/api/otp/send"</span>
                  <span className="text-gray-400">,</span>{"\n"}
                  <span className="text-white">  {"{"} </span>
                  <span className="text-blue-300">method</span>
                  <span className="text-gray-400">: </span>
                  <span className="text-green-300">"POST"</span>
                  <span className="text-white">, </span>
                  <span className="text-blue-300">body</span>
                  <span className="text-gray-400">: </span>
                  <span className="text-yellow-300">JSON</span>
                  <span className="text-white">.</span>
                  <span className="text-yellow-300">stringify</span>
                  <span className="text-gray-400">{"({"}</span>{"\n"}
                  <span className="text-blue-300">    phoneNumber</span>
                  <span className="text-gray-400">: </span>
                  <span className="text-white">user.phone</span>
                  <span className="text-gray-400">,</span>{"\n"}
                  <span className="text-gray-400">  {"})"}  {"}"}</span>
                  <span className="text-white">)</span>{"\n"}
                  <span className="text-green-400">{"// ✓ Done. requestId returned."}</span>
                </pre>
              </div>

              <div className="mt-5">
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
                  Read full case study →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* sub-line */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Join FlutterPay and 2,400+ other Nigerian products on WhatOTP — free to start.
        </p>
      </div>
    </div>
  );
}
