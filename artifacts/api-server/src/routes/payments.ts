import { Router } from "express";
import { randomBytes } from "crypto";
import { db, subscriptionsTable, plansTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

function getPaystackSecret(): string | undefined {
  return process.env.PAYSTACK_SECRET_KEY;
}

router.post("/payments/initialize", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { planId } = req.body;

  if (!planId) return res.status(400).json({ error: "planId is required" });

  const secret = getPaystackSecret();
  if (!secret) return res.status(503).json({ error: "Payment gateway not configured. Please add PAYSTACK_SECRET_KEY." });

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
  if (!plan) return res.status(400).json({ error: "Plan not found" });

  const reference = `watp_${randomBytes(12).toString("hex")}`;

  // Build callback URL — prefer BASE_DOMAIN env var, then request origin
  const baseDomain = process.env.BASE_DOMAIN;
  const origin = baseDomain
    ? `https://${baseDomain}`
    : (req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "");
  const callbackUrl = `${origin}/dashboard/subscription?paystack_ref=${reference}`;

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      email: req.user!.email,
      amount: Math.round(plan.price * 100), // convert NGN to kobo
      reference,
      callback_url: callbackUrl,
      currency: "NGN",
      metadata: { planId: plan.id, userId, planName: plan.name },
    }),
  });

  const data = await response.json() as any;
  if (!data.status) {
    return res.status(502).json({ error: data.message || "Payment initialization failed" });
  }

  return res.json({
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency,
  });
});

router.get("/payments/verify/:reference", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const reference = req.params.reference as string;

  const secret = getPaystackSecret();
  if (!secret) return res.status(503).json({ error: "Payment gateway not configured" });

  // Prevent double-use of a reference
  const [existing] = await db
    .select()
    .from(subscriptionsTable)
    .where(sql`${subscriptionsTable.paystackRef} = ${reference}`)
    .limit(1);
  if (existing) {
    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, existing.planId)).limit(1);
    return res.json({ ...existing, plan: plan || null });
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const data = await response.json() as any;
  if (!data.status || data.data?.status !== "success") {
    return res.status(400).json({ error: "Payment not successful or not found" });
  }

  const planId = data.data?.metadata?.planId;
  if (!planId) return res.status(400).json({ error: "Invalid payment metadata" });

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
  if (!plan) return res.status(400).json({ error: "Plan not found" });

  // Cancel any existing active subscriptions for this user
  await db.update(subscriptionsTable)
    .set({ status: "cancelled" })
    .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")));

  const startDate = new Date();
  const endDate = new Date(startDate);
  if (plan.period === "weekly") endDate.setDate(endDate.getDate() + 7);
  else if (plan.period === "monthly") endDate.setMonth(endDate.getMonth() + 1);
  else endDate.setFullYear(endDate.getFullYear() + 1);

  const [sub] = await db.insert(subscriptionsTable).values({
    userId,
    planId: plan.id,
    status: "active",
    startDate,
    endDate,
    paystackRef: reference,
  }).returning();

  return res.status(201).json({
    ...sub,
    plan: { id: plan.id, name: plan.name, period: plan.period, price: plan.price, otpLimit: plan.otpLimit, features: plan.features, popular: plan.popular },
  });
});

export default router;
