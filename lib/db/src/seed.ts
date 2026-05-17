import { db, plansTable, usersTable, subscriptionsTable, whatsappNumbersTable, apiKeysTable, botConfigsTable, botConversationsTable, otpRequestsTable, broadcastsTable } from "./index";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// Pre-hashed bcrypt hash for "Admin@1234" (cost 12)
const ADMIN_PASSWORD_HASH = "$2b$12$xxQhe5Bm/Smq8FvdsjoiTusBzj.vSgQVsJmAK8qD1mmZdweKT6gd6";
// Pre-hashed bcrypt hash for "Demo@1234" (cost 12)
const DEMO_PASSWORD_HASH = "$2b$12$wFy4CD0xkhqyhyt.PpUlXOf.JJXM8GK3e8lWQW0wGDzqUdRU87Et6";

async function seed() {
  // ─── CLEAR ALL (in reverse FK order) ─────────────────────────────────────
  console.log("\n[0/9] Clearing existing data (reverse FK order)...");
  await db.delete(broadcastsTable);
  await db.delete(botConversationsTable);
  await db.delete(botConfigsTable);
  await db.delete(otpRequestsTable);
  await db.delete(apiKeysTable);
  await db.delete(subscriptionsTable);
  await db.delete(whatsappNumbersTable);
  await db.delete(usersTable);
  await db.delete(plansTable);
  console.log("  ✓ All tables cleared.");

  // ─── PLANS ────────────────────────────────────────────────────────────────
  console.log("\n[1/9] Seeding plans...");

  const [freePlan, starterPlan, growthPlan, businessPlan, enterprisePlan] = await db
    .insert(plansTable)
    .values([
      {
        name: "Free",
        period: "monthly",
        price: 0,
        currency: "NGN",
        otpLimit: 10,
        popular: false,
        active: true,
        allowCustomNumber: false,
        allowUsaNumbers: false,
        features: [
          "10 OTPs per month",
          "AchekOTP branding on messages",
          "1 API key",
          "Nigerian numbers only",
          "Community support",
        ],
      },
      {
        name: "Starter",
        period: "monthly",
        price: 2500,
        currency: "NGN",
        otpLimit: 500,
        popular: false,
        active: true,
        allowCustomNumber: false,
        allowUsaNumbers: false,
        features: [
          "500 OTPs per month",
          "No branding on messages",
          "Nigerian numbers",
          "API access + analytics",
          "Email support",
        ],
      },
      {
        name: "Growth",
        period: "monthly",
        price: 7500,
        currency: "NGN",
        otpLimit: 2000,
        popular: true,
        active: true,
        allowCustomNumber: false,
        allowUsaNumbers: false,
        features: [
          "2,000 OTPs per month",
          "Nigerian & UK numbers",
          "Full analytics dashboard",
          "Priority email support",
          "Webhook notifications",
        ],
      },
      {
        name: "Business",
        period: "monthly",
        price: 18000,
        currency: "NGN",
        otpLimit: 10000,
        popular: false,
        active: true,
        allowCustomNumber: true,
        allowUsaNumbers: false,
        features: [
          "10,000 OTPs per month",
          "All countries supported",
          "Your own WhatsApp number",
          "Custom display name",
          "Priority support",
          "Custom OTP templates",
        ],
      },
      {
        name: "Enterprise",
        period: "monthly",
        price: 45000,
        currency: "NGN",
        otpLimit: 50000,
        popular: false,
        active: true,
        allowCustomNumber: true,
        allowUsaNumbers: true,
        features: [
          "50,000 OTPs per month",
          "US, UK & Nigerian numbers",
          "Your own WhatsApp number",
          "Dedicated account manager",
          "24/7 priority support",
          "SLA guarantee",
        ],
      },
    ])
    .returning();

  console.log(`  ✓ 5 plans seeded (Free, Starter, Growth, Business, Enterprise)`);

  // ─── USERS ────────────────────────────────────────────────────────────────
  console.log("\n[2/9] Seeding users...");

  const upsertUser = async (data: {
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    phoneNumber?: string;
    phoneVerified: boolean;
  }) => {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, data.email)).limit(1);
    if (existing) return existing;
    const [created] = await db.insert(usersTable).values({ ...data, suspended: false }).returning();
    return created;
  };

  const admin = await upsertUser({
    email: "admin@acheckotp.com",
    passwordHash: ADMIN_PASSWORD_HASH,
    name: "Admin",
    role: "admin",
    phoneVerified: true,
  });

  const calebo = await upsertUser({
    email: "calebosky@acheckotp.com",
    passwordHash: ADMIN_PASSWORD_HASH,
    name: "Calebosky",
    role: "admin",
    phoneVerified: true,
  });

  const demo = await upsertUser({
    email: "demo@acheckotp.com",
    passwordHash: DEMO_PASSWORD_HASH,
    name: "Demo User",
    role: "user",
    phoneNumber: "+2348012345678",
    phoneVerified: true,
  });

  const alice = await upsertUser({
    email: "alice@kuda.ng",
    passwordHash: DEMO_PASSWORD_HASH,
    name: "Alice Okafor",
    role: "user",
    phoneNumber: "+2348111222333",
    phoneVerified: true,
  });

  const bob = await upsertUser({
    email: "bob@piggybank.ng",
    passwordHash: DEMO_PASSWORD_HASH,
    name: "Bob Adeyemi",
    role: "user",
    phoneNumber: "+2348044556677",
    phoneVerified: false,
  });

  const carol = await upsertUser({
    email: "carol@techstartup.ng",
    passwordHash: DEMO_PASSWORD_HASH,
    name: "Carol Eze",
    role: "user",
    phoneNumber: "+2349012345678",
    phoneVerified: true,
  });

  console.log(`  ✓ 6 users seeded (2 admins + 4 regular users)`);

  // ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────
  console.log("\n[3/9] Seeding subscriptions...");

  const makeEndDate = (years = 100) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d;
  };

  const makeEndDateMonths = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const existingSubs = await db.select().from(subscriptionsTable);
  if (existingSubs.length === 0) {
    await db.insert(subscriptionsTable).values([
      // admin → Free (lifetime)
      { userId: admin.id, planId: freePlan.id, status: "active", startDate: new Date(), endDate: makeEndDate(), otpUsed: 0 },
      // calebo → Enterprise (lifetime)
      { userId: calebo.id, planId: enterprisePlan.id, status: "active", startDate: new Date(), endDate: makeEndDate(), otpUsed: 0 },
      // demo → Free
      { userId: demo.id, planId: freePlan.id, status: "active", startDate: new Date(), endDate: makeEndDate(), otpUsed: 7 },
      // alice → Growth
      { userId: alice.id, planId: growthPlan.id, status: "active", startDate: new Date(), endDate: makeEndDateMonths(1), otpUsed: 423, paystackRef: "PAY_abc123kuda" },
      // bob → Starter (expired)
      { userId: bob.id, planId: starterPlan.id, status: "expired", startDate: new Date(Date.now() - 60 * 86400 * 1000), endDate: new Date(Date.now() - 1000), otpUsed: 499, paystackRef: "PAY_xyz789piggy" },
      // carol → Business
      { userId: carol.id, planId: businessPlan.id, status: "active", startDate: new Date(), endDate: makeEndDateMonths(1), otpUsed: 1872, paystackRef: "PAY_carol_biz" },
    ]);
    console.log(`  ✓ 6 subscriptions seeded`);
  } else {
    console.log(`  ⏭  Subscriptions already exist, skipping.`);
  }

  // ─── WHATSAPP NUMBERS ─────────────────────────────────────────────────────
  console.log("\n[4/9] Seeding WhatsApp numbers...");

  const existingNums = await db.select().from(whatsappNumbersTable);
  if (existingNums.length === 0) {
    await db.insert(whatsappNumbersTable).values([
      // Pool numbers (ownerId = null)
      { phoneNumber: "+2348100000001", country: "ng", label: "Pool NG #1", status: "connected", sessionActive: true, otpSentCount: 3821 },
      { phoneNumber: "+2348100000002", country: "ng", label: "Pool NG #2", status: "connected", sessionActive: true, otpSentCount: 2104 },
      { phoneNumber: "+2348100000003", country: "ng", label: "Pool NG #3", status: "disconnected", sessionActive: false, otpSentCount: 501 },
      { phoneNumber: "+447700900001", country: "uk", label: "Pool UK #1", status: "connected", sessionActive: true, otpSentCount: 998 },
      { phoneNumber: "+447700900002", country: "uk", label: "Pool UK #2", status: "error", sessionActive: false, otpSentCount: 12 },
      // User-owned custom numbers
      { phoneNumber: "+2349055667788", country: "ng", label: "Carol's Number", status: "connected", sessionActive: true, otpSentCount: 1872, ownerId: carol.id },
    ]);
    console.log(`  ✓ 6 WhatsApp numbers seeded (5 pool + 1 user-owned)`);
  } else {
    console.log(`  ⏭  WhatsApp numbers already exist, skipping.`);
  }

  // Fetch numbers for FK references
  const allNums = await db.select().from(whatsappNumbersTable);
  const poolNg1 = allNums.find(n => n.phoneNumber === "+2348100000001")!;

  // ─── API KEYS ─────────────────────────────────────────────────────────────
  console.log("\n[5/9] Seeding API keys...");

  const existingKeys = await db.select().from(apiKeysTable);
  if (existingKeys.length === 0) {
    // Pre-hashed (bcrypt cost 10) API keys for seeding — raw keys shown in comments
    const seedKeys = [
      { userId: demo.id,  name: "Demo Default Key",    keyPrefix: "ak_demo0", keyHash: "$2b$10$KLzFW.wQc9ZvSwq6oDMX8.vbZa4RwC.6qmLs6xkzGMw8cjQYHQcQa", requestCount: 7 },
      { userId: alice.id, name: "Kuda Production",     keyPrefix: "ak_kuda0", keyHash: "$2b$10$7A84XDXYPJjoV5LbHTT0COi5Fs7cC87InIdYLOFNN4bzho7nap9R2", requestCount: 5291 },
      { userId: alice.id, name: "Kuda Staging",        keyPrefix: "ak_kuda0", keyHash: "$2b$10$45s9pT.y35bCGWmh9bNuiOFi.F3E6ppHQ4FoIZUyv3r06AArTPWi2", requestCount: 83 },
      { userId: bob.id,   name: "PiggyBank API",       keyPrefix: "ak_piggy", keyHash: "$2b$10$U1KpNXwZ8bfZozdcFdyh1eTNd2gZzUrNBtwuQc9mCFeqPkewtbj/q", requestCount: 499 },
      { userId: carol.id, name: "TechStartup Primary", keyPrefix: "ak_carol", keyHash: "$2b$10$jpXkIXfUcmke0JMDNde7duLYfiQ91yzcd4vYN.TkaWcwzCT167xvG", requestCount: 1872 },
      { userId: carol.id, name: "TechStartup Backup",  keyPrefix: "ak_carol", keyHash: "$2b$10$fqYr1ggWLhTiDPw0jo42zOJa25eb24.F/eKcKJVacNmWe08ZDw7eu", requestCount: 0 },
    ];
    await db.insert(apiKeysTable).values(seedKeys.map(k => ({ ...k, status: "active" })));
    console.log(`  ✓ 6 API keys seeded`);
  } else {
    console.log(`  ⏭  API keys already exist, skipping.`);
  }

  // ─── BOT CONFIGS ──────────────────────────────────────────────────────────
  console.log("\n[6/9] Seeding bot configs...");

  const existingBots = await db.select().from(botConfigsTable);
  if (existingBots.length === 0) {
    const [demoBot, carolBot] = await db.insert(botConfigsTable).values([
      {
        userId: demo.id,
        enabled: false,
        provider: "openai",
        model: "gpt-4o-mini",
        botName: "DemoBot",
        systemPrompt: "You are a helpful customer support assistant. Be friendly, concise and professional.",
        welcomeMessage: "Hi! I'm DemoBot. How can I help you today?",
        fallbackMessage: "I'm sorry, I didn't understand that. Could you rephrase?",
        features: JSON.stringify(["faq", "support"]),
        maxTokens: 500,
        totalMessages: 0,
        language: "en",
        businessHoursEnabled: false,
        businessHoursStart: "09:00",
        businessHoursEnd: "17:00",
        businessHoursTimezone: "Africa/Lagos",
        responseDelayMs: 1500,
        typingIndicatorEnabled: true,
      },
      {
        userId: carol.id,
        enabled: true,
        provider: "openai",
        model: "gpt-4o-mini",
        botName: "TechBot",
        systemPrompt: "You are TechBot, a customer support assistant for TechStartup.ng. Help users with account issues, OTP verification, and general questions. Always be professional.",
        welcomeMessage: "Hello! Welcome to TechStartup support. I'm TechBot. How can I assist you?",
        fallbackMessage: "I'm not sure I understood. Could you rephrase or type 'help' for options?",
        features: JSON.stringify(["faq", "support", "handoff"]),
        maxTokens: 800,
        totalMessages: 247,
        language: "en",
        businessHoursEnabled: true,
        businessHoursStart: "08:00",
        businessHoursEnd: "18:00",
        businessHoursTimezone: "Africa/Lagos",
        outsideHoursMessage: "We're currently closed. Our hours are 8am–6pm WAT. We'll respond first thing in the morning!",
        handoffKeyword: "human",
        handoffMessage: "Connecting you to a human agent. Please wait...",
        responseDelayMs: 1200,
        typingIndicatorEnabled: true,
      },
    ]).returning();

    console.log(`  ✓ 2 bot configs seeded`);

    // ─── BOT CONVERSATIONS ─────────────────────────────────────────────────
    console.log("\n[7/9] Seeding bot conversations...");

    await db.insert(botConversationsTable).values([
      { botConfigId: carolBot.id, sessionId: "+2347011223344", role: "user", content: "Hello, I need help verifying my account", createdAt: new Date(Date.now() - 3600_000) },
      { botConfigId: carolBot.id, sessionId: "+2347011223344", role: "assistant", content: "Hello! Welcome to TechStartup support. I'm TechBot. How can I assist you?", createdAt: new Date(Date.now() - 3599_000) },
      { botConfigId: carolBot.id, sessionId: "+2347011223344", role: "user", content: "I didn't receive my OTP", createdAt: new Date(Date.now() - 3500_000) },
      { botConfigId: carolBot.id, sessionId: "+2347011223344", role: "assistant", content: "I'm sorry to hear that! Please check that your WhatsApp is active and try requesting a new OTP. If the issue persists, type 'human' to speak with an agent.", createdAt: new Date(Date.now() - 3499_000) },
      { botConfigId: carolBot.id, sessionId: "+2348099887766", role: "user", content: "What are your business hours?", createdAt: new Date(Date.now() - 7200_000) },
      { botConfigId: carolBot.id, sessionId: "+2348099887766", role: "assistant", content: "Our support team is available Monday–Friday, 8am–6pm WAT. Is there anything I can help you with right now?", createdAt: new Date(Date.now() - 7199_000) },
    ]);

    console.log(`  ✓ 6 bot conversation messages seeded`);
  } else {
    console.log(`  ⏭  Bot configs already exist, skipping.`);
    console.log(`  ⏭  Bot conversations skipped (depend on bot configs).`);
  }

  // ─── OTP REQUESTS ─────────────────────────────────────────────────────────
  console.log("\n[8/9] Seeding OTP requests...");

  const existingOtps = await db.select().from(otpRequestsTable);
  if (existingOtps.length === 0) {
    const now = Date.now();
    await db.insert(otpRequestsTable).values([
      { userId: demo.id, requestId: randomUUID(), phoneNumber: "+2348012345678", code: "482910", status: "verified", country: "ng", whatsappNumberId: poolNg1?.id, expiresAt: new Date(now - 60_000), createdAt: new Date(now - 5 * 60_000), updatedAt: new Date(now - 4 * 60_000) },
      { userId: alice.id, requestId: randomUUID(), phoneNumber: "+2348111222333", code: "774321", status: "verified", country: "ng", whatsappNumberId: poolNg1?.id, expiresAt: new Date(now - 120_000), createdAt: new Date(now - 15 * 60_000), updatedAt: new Date(now - 14 * 60_000) },
      { userId: alice.id, requestId: randomUUID(), phoneNumber: "+2348055443322", code: "192837", status: "sent", country: "ng", whatsappNumberId: poolNg1?.id, expiresAt: new Date(now + 9 * 60_000), createdAt: new Date(now - 60_000), updatedAt: new Date(now - 60_000) },
      { userId: alice.id, requestId: randomUUID(), phoneNumber: "+2349088776655", code: "556677", status: "expired", country: "ng", whatsappNumberId: poolNg1?.id, expiresAt: new Date(now - 3600_000), createdAt: new Date(now - 73 * 60_000), updatedAt: new Date(now - 63 * 60_000) },
      { userId: carol.id, requestId: randomUUID(), phoneNumber: "+2349012345678", code: "918273", status: "verified", country: "ng", whatsappNumberId: poolNg1?.id, expiresAt: new Date(now - 300_000), createdAt: new Date(now - 25 * 60_000), updatedAt: new Date(now - 24 * 60_000) },
      { userId: carol.id, requestId: randomUUID(), phoneNumber: "+2347065432187", code: "364819", status: "failed", country: "ng", whatsappNumberId: poolNg1?.id, expiresAt: new Date(now - 7200_000), createdAt: new Date(now - 3 * 3600_000), updatedAt: new Date(now - 3 * 3600_000) },
      { userId: carol.id, requestId: randomUUID(), phoneNumber: "+447700900099", code: "241536", status: "verified", country: "uk", expiresAt: new Date(now - 180_000), createdAt: new Date(now - 30 * 60_000), updatedAt: new Date(now - 29 * 60_000) },
    ]);
    console.log(`  ✓ 7 OTP requests seeded`);
  } else {
    console.log(`  ⏭  OTP requests already exist, skipping.`);
  }

  // ─── BROADCASTS ───────────────────────────────────────────────────────────
  console.log("\n[9/9] Seeding broadcasts...");

  const existingBroadcasts = await db.select().from(broadcastsTable);
  if (existingBroadcasts.length === 0) {
    await db.insert(broadcastsTable).values([
      {
        userId: carol.id,
        name: "Black Friday Promo",
        message: "🎉 Big savings this Black Friday! Use code BF2025 for 30% off all our services. Valid today only. Reply STOP to opt out.",
        recipients: JSON.stringify(["+2349012345678", "+2347065432187", "+2348099887766", "+2348055443322"]),
        status: "done",
        total: 4,
        sent: 4,
        failedCount: 0,
        createdAt: new Date(Date.now() - 7 * 86400_000),
        updatedAt: new Date(Date.now() - 7 * 86400_000),
      },
      {
        userId: carol.id,
        name: "System Maintenance Alert",
        message: "🔧 Scheduled maintenance on Dec 15, 2am–4am WAT. Services may be briefly unavailable. Apologies for any inconvenience.",
        recipients: JSON.stringify(["+2349012345678", "+2347065432187", "+2348099887766"]),
        status: "done",
        total: 3,
        sent: 2,
        failedCount: 1,
        createdAt: new Date(Date.now() - 14 * 86400_000),
        updatedAt: new Date(Date.now() - 14 * 86400_000),
      },
      {
        userId: alice.id,
        name: "Kuda Account Reminder",
        message: "Reminder: Please complete your KYC verification on the Kuda app to avoid service interruption.",
        recipients: JSON.stringify(["+2348111222333", "+2348055443322", "+2349088776655", "+2348144332211", "+2347099887766"]),
        status: "sending",
        total: 5,
        sent: 3,
        failedCount: 0,
        createdAt: new Date(Date.now() - 600_000),
        updatedAt: new Date(Date.now() - 60_000),
      },
    ]);
    console.log(`  ✓ 3 broadcasts seeded`);
  } else {
    console.log(`  ⏭  Broadcasts already exist, skipping.`);
  }

  console.log("\n✅ All tables seeded successfully!\n");
  console.log("Credentials (all share password Admin@1234 except demo users which use Demo@1234):");
  console.log("  Admin:     admin@acheckotp.com     / Admin@1234");
  console.log("  Admin:     calebosky@acheckotp.com / Admin@1234");
  console.log("  User:      demo@acheckotp.com      / Demo@1234");
  console.log("  User:      alice@kuda.ng           / Demo@1234");
  console.log("  User:      bob@piggybank.ng        / Demo@1234");
  console.log("  User:      carol@techstartup.ng    / Demo@1234");

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
