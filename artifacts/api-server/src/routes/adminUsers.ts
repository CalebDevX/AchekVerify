import { Router } from "express";
import { db, usersTable, subscriptionsTable, plansTable, otpRequestsTable, apiKeysTable, whatsappNumbersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";
import { stopSession } from "../lib/baileys-manager";

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
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
    subscription: sub ? { ...sub, plan } : undefined,
    otpCount: otpCountResult?.count ?? 0,
  };
}

// List all users (with search/filter)
router.get("/admin/users", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const users = await db.select().from(usersTable).limit(limit).offset(offset);
  const usersWithData = await Promise.all(users.map(buildUserResponse));
  return res.json(usersWithData);
});

// Get single user
router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(await buildUserResponse(user));
});

// Suspend / unsuspend user
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

// Change user role (user <-> admin)
router.post("/admin/users/:id/role", requireAdmin, async (req: AuthRequest, res) => {
  const adminId = req.user?.id;
  const id = parseInt(req.params.id as string);
  const { role } = req.body;

  if (!role || !["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "role must be 'user' or 'admin'" });
  }
  if (adminId === id) {
    return res.status(400).json({ error: "Cannot change your own role" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [updated] = await db.update(usersTable)
    .set({ role })
    .where(eq(usersTable.id, id))
    .returning();

  req.log.info({ userId: id, role, adminId }, "Admin changed user role");
  return res.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    suspended: updated.suspended,
    createdAt: updated.createdAt,
  });
});

// Edit user details (name, email)
router.patch("/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
  const adminId = req.user?.id;
  const id = parseInt(req.params.id as string);
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({ error: "At least one field (name or email) is required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name?.trim()) updates.name = name.trim();
  if (email?.trim()) updates.email = email.trim().toLowerCase();

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();

  req.log.info({ userId: id, adminId }, "Admin edited user");
  return res.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    suspended: updated.suspended,
    createdAt: updated.createdAt,
  });
});

// Delete user (permanently — cascades subscriptions, API keys, numbers, OTP logs)
router.delete("/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
  const adminId = req.user?.id;
  const id = parseInt(req.params.id as string);

  if (adminId === id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Stop and remove user's WhatsApp sessions
  const userNumbers = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, id));
  for (const num of userNumbers) {
    await stopSession(num.id).catch(() => {});
  }
  await db.delete(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, id));

  // Cancel subscriptions
  await db.update(subscriptionsTable)
    .set({ status: "cancelled" })
    .where(eq(subscriptionsTable.userId, id));

  // Revoke API keys
  await db.update(apiKeysTable)
    .set({ status: "revoked" })
    .where(eq(apiKeysTable.userId, id));

  // Delete OTP logs
  await db.delete(otpRequestsTable).where(eq(otpRequestsTable.userId, id));

  // Finally delete user
  await db.delete(usersTable).where(eq(usersTable.id, id));

  req.log.info({ userId: id, email: user.email, adminId }, "Admin deleted user");
  return res.json({ success: true, message: `User ${user.email} deleted` });
});

// Assign plan to user
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
