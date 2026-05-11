import { Router } from "express";
import { db, usersTable, subscriptionsTable, plansTable, otpRequestsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function buildUserResponse(user: typeof usersTable.$inferSelect) {
  const [sub] = await db.select().from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.userId, user.id), eq(subscriptionsTable.status, "active")))
    .limit(1);

  let plan = null;
  if (sub) {
    const [p] = await db.select().from(plansTable).where(eq(plansTable.id, sub.planId)).limit(1);
    plan = p ? { id: p.id, name: p.name, period: p.period, price: p.price, otpLimit: p.otpLimit, features: p.features, popular: p.popular } : null;
  }

  const [otpCountResult] = await db.select({ count: count() }).from(otpRequestsTable).where(eq(otpRequestsTable.userId, user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    suspended: user.suspended,
    createdAt: user.createdAt,
    subscription: sub ? { ...sub, plan } : undefined,
    otpCount: otpCountResult?.count ?? 0,
  };
}

router.get("/admin/users", requireAdmin, async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const users = await db.select().from(usersTable).limit(limit).offset(offset);
  const usersWithData = await Promise.all(users.map(buildUserResponse));
  return res.json(usersWithData);
});

router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(await buildUserResponse(user));
});

router.post("/admin/users/:id/suspend", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [updated] = await db.update(usersTable)
    .set({ suspended: !user.suspended })
    .where(eq(usersTable.id, id))
    .returning();

  return res.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    suspended: updated.suspended,
    createdAt: updated.createdAt,
  });
});

router.post("/admin/users/:id/assign-plan", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const planId = typeof req.body.planId === "number" ? req.body.planId : parseInt(req.body.planId);
  if (!planId || isNaN(planId) || planId <= 0) return res.status(400).json({ error: "planId is required" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  await db.update(subscriptionsTable)
    .set({ status: "cancelled" })
    .where(and(eq(subscriptionsTable.userId, id), eq(subscriptionsTable.status, "active")));

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const [sub] = await db.insert(subscriptionsTable).values({
    userId: id,
    planId: plan.id,
    status: "active",
    otpUsed: 0,
    startDate: now,
    endDate: periodEnd,
  }).returning();

  const adminReq = req as AuthRequest;
  req.log.info({ userId: id, planId: plan.id, adminId: adminReq.user?.id }, "Admin assigned plan to user");

  return res.json({ success: true, subscription: sub, plan: { id: plan.id, name: plan.name } });
});

export default router;
