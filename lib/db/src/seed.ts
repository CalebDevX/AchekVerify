import { db, plansTable } from "./index";

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
        "WhatOTP branding on messages",
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
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
