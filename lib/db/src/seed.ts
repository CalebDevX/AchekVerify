import { db, plansTable, usersTable } from "./index";
import { eq } from "drizzle-orm";

// Pre-hashed bcrypt hash for "Admin@1234" (cost 12)
const ADMIN_PASSWORD_HASH = "$2b$12$xxQhe5Bm/Smq8FvdsjoiTusBzj.vSgQVsJmAK8qD1mmZdweKT6gd6";

async function seed() {
  console.log("Seeding plans with NGN pricing...");

  await db.delete(plansTable);

  await db.insert(plansTable).values([
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
  ]);

  console.log("Done. 5 plans (Free + 4 NGN paid) seeded.");

  // ── Admin: admin@acheckotp.com ────────────────────────────────────────────
  const adminEmail = "admin@acheckotp.com";
  const [existingAdmin] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
  if (!existingAdmin) {
    await db.insert(usersTable).values({
      email: adminEmail,
      passwordHash: ADMIN_PASSWORD_HASH,
      name: "Admin",
      role: "admin",
      suspended: false,
      phoneVerified: true,
    });
    console.log(`Admin user created: ${adminEmail} / Admin@1234`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  // ── Admin: calebosky ──────────────────────────────────────────────────────
  const caleboEmail = "calebosky@acheckotp.com";
  const [existingCalebo] = await db.select().from(usersTable).where(eq(usersTable.email, caleboEmail)).limit(1);
  if (!existingCalebo) {
    await db.insert(usersTable).values({
      email: caleboEmail,
      passwordHash: ADMIN_PASSWORD_HASH,
      name: "Calebosky",
      role: "admin",
      suspended: false,
      phoneVerified: true,
    });
    console.log(`Admin user created: ${caleboEmail} / Admin@1234`);
  } else {
    console.log("Calebosky admin already exists, skipping.");
  }

  // ── Demo user ─────────────────────────────────────────────────────────────
  const demoEmail = "demo@acheckotp.com";
  const [existingDemo] = await db.select().from(usersTable).where(eq(usersTable.email, demoEmail)).limit(1);
  if (!existingDemo) {
    await db.insert(usersTable).values({
      email: demoEmail,
      passwordHash: ADMIN_PASSWORD_HASH,
      name: "Demo User",
      role: "user",
      suspended: false,
      phoneVerified: false,
    });
    console.log(`Demo user created: ${demoEmail} / Admin@1234`);
  } else {
    console.log("Demo user already exists, skipping.");
  }

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
