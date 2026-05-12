const TWEETS = [
  {
    name: "Chidi Okonkwo",
    handle: "@chidi_builds",
    avatar: "CO",
    avatarBg: "#7B3FE4",
    role: "Senior Dev @ Paystack",
    time: "2 days ago",
    text: "Switched our entire OTP stack from Termii to @WhatOTP last month. Delivery rate went from 78% to 99.1% and we're saving ₦47,000/month. The integration literally took me 14 minutes.",
    likes: 312,
    rts: 89,
    verified: true,
  },
  {
    name: "Adaeze Nwosu",
    handle: "@adaeze_dev",
    avatar: "AN",
    avatarBg: "#EC4899",
    role: "CTO @ Savi (YC W23)",
    time: "1 week ago",
    text: "The thing that got me: WhatOTP doesn't just send OTPs. It sends them from a recognizable WhatsApp number that users trust. Our verification completion rate jumped 31% in the first week.",
    likes: 201,
    rts: 54,
    verified: true,
  },
  {
    name: "Emeka Osei",
    handle: "@emeka_hacks",
    avatar: "EO",
    avatarBg: "#F59E0B",
    role: "Indie developer, Lagos",
    time: "3 days ago",
    text: "Built a KYC flow for a fintech client. Tried 3 different SMS providers, all had issues with MTN routing. Switched to @WhatOTP — not a single failed delivery in 2 weeks. Should've done this from day 1.",
    likes: 178,
    rts: 41,
    verified: false,
  },
  {
    name: "Fatima Al-Hassan",
    handle: "@fatima_frontend",
    avatar: "FA",
    avatarBg: "#10B981",
    role: "Lead Engineer @ Cowrywise",
    time: "5 days ago",
    text: "Hot take: Nigerian devs spending ₦15/SMS should just move to WhatsApp OTP. The economics are embarrassingly obvious. We did it 6 months ago and the numbers are wild.",
    likes: 445,
    rts: 127,
    verified: true,
  },
  {
    name: "Tunde Adeyemi",
    handle: "@tunde_ng_dev",
    avatar: "TA",
    avatarBg: "#3B82F6",
    role: "Backend Engineer @ Flutterwave",
    time: "1 day ago",
    text: "Two endpoints. No SDK. I integrated @WhatOTP into our Django backend during a lunch break. CEO asked why the OTP verification drop-off numbers suddenly improved. This is why.",
    likes: 289,
    rts: 76,
    verified: false,
  },
  {
    name: "Ngozi Ibe",
    handle: "@ngozi_makes",
    avatar: "NI",
    avatarBg: "#8B5CF6",
    role: "Founder @ Karis Health",
    time: "4 days ago",
    text: "Our patients are 50+ years old and don't always see SMS. WhatsApp? They're on it all day. WhatOTP for healthcare OTPs was a no-brainer and the Ts API is clean. Recommended.",
    likes: 134,
    rts: 31,
    verified: true,
  },
];

function HeartIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function RetweetIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
    </svg>
  );
}

export function DeveloperTweets() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* nav */}
      <nav className="bg-white border-b border-gray-100 px-10 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">W</div>
          <span className="font-bold text-gray-900">WhatOTP</span>
        </div>
        <button className="bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded-xl">Start free</button>
      </nav>

      {/* header */}
      <div className="text-center py-12 px-6">
        <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest mb-3">Developer community</p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
          What Nigerian devs are saying
        </h2>
        <p className="text-gray-500 text-base max-w-lg mx-auto">
          Real developers. Real integrations. Real ₦ saved.
        </p>
      </div>

      {/* tweets grid */}
      <div className="flex-1 px-6 pb-12 overflow-hidden">
        <div className="max-w-5xl mx-auto columns-2 gap-4 space-y-4">
          {TWEETS.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all break-inside-avoid mb-4"
            >
              {/* author */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: t.avatarBg }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900 text-sm">{t.name}</span>
                      {t.verified && (
                        <svg className="w-3.5 h-3.5 text-emerald-500 fill-current" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs">{t.handle} · {t.role}</div>
                  </div>
                </div>
                {/* X logo */}
                <svg className="w-4 h-4 text-gray-300 fill-current flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.847L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>

              {/* text */}
              <p className="text-gray-800 text-sm leading-relaxed mb-4">
                {t.text.split("@WhatOTP").map((part, pi) => (
                  pi === 0 ? part : (
                    <><span key={pi} className="text-emerald-600 font-medium">@WhatOTP</span>{part}</>
                  )
                ))}
              </p>

              {/* actions */}
              <div className="flex items-center gap-5 text-gray-400 text-xs border-t border-gray-50 pt-3">
                <span className="text-[10px] text-gray-300">{t.time}</span>
                <div className="flex items-center gap-1 ml-auto hover:text-pink-500 cursor-pointer transition-colors">
                  <HeartIcon />
                  <span>{t.likes}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer transition-colors">
                  <RetweetIcon />
                  <span>{t.rts}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
