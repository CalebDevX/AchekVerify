import { Router } from "express";
import { db, subscriptionsTable, plansTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/subscriptions/current", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
    .limit(1);

  if (!sub) {
    return res.status(404).json({ error: "No active subscription" });
  }

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, sub.planId)).limit(1);

  return res.json({
    ...sub,
    plan: plan ? {
      id: plan.id,
      name: plan.name,
      period: plan.period,
      price: plan.price,
      otpLimit: plan.otpLimit,
      features: plan.features,
      popular: plan.popular,
    } : null,
  });
});

router.post("/subscriptions", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({ error: "planId is required" });
  }

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
  if (!plan) {
    return res.status(400).json({ error: "Plan not found" });
  }

  // Cancel existing active subscriptions
  await db.update(subscriptionsTable)
    .set({ status: "cancelled" })
    .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")));

  // Calculate end date based on period
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (plan.period === "weekly") {
    endDate.setDate(endDate.getDate() + 7);
  } else if (plan.period === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (plan.period === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const [sub] = await db.insert(subscriptionsTable).values({
    userId,
    planId,
    status: "active",
    startDate,
    endDate,
  }).returning();

  return res.status(201).json({
    ...sub,
    plan: {
      id: plan.id,
      name: plan.name,
      period: plan.period,
      price: plan.price,
      otpLimit: plan.otpLimit,
      features: plan.features,
      popular: plan.popular,
    },
  });
});

router.post("/subscriptions/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);

  const [sub] = await db.select().from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)))
    .limit(1);

  if (!sub) {
    return res.status(404).json({ error: "Subscription not found" });
  }

  const [updated] = await db.update(subscriptionsTable)
    .set({ status: "cancelled" })
    .where(eq(subscriptionsTable.id, id))
    .returning();

  return res.json(updated);
});

export default router;
