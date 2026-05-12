import { Router } from "express";
import { db, otpRequestsTable, subscriptionsTable, plansTable, apiKeysTable, usersTable, whatsappNumbersTable } from "@workspace/db";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [otpTodayResult] = await db.select({ count: count() }).from(otpRequestsTable)
    .where(and(eq(otpRequestsTable.userId, userId), gte(otpRequestsTable.createdAt, todayStart)));

  const [otpMonthResult] = await db.select({ count: count() }).from(otpRequestsTable)
    .where(and(eq(otpRequestsTable.userId, userId), gte(otpRequestsTable.createdAt, monthStart)));

  const allOtps = await db.select().from(otpRequestsTable)
    .where(and(eq(otpRequestsTable.userId, userId), gte(otpRequestsTable.createdAt, monthStart)));

  const verified = allOtps.filter(o => o.status === "verified").length;
  const successRate = allOtps.length > 0 ? Math.round((verified / allOtps.length) * 100) : 0;

  const [sub] = await db.select().from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
    .limit(1);

  let remainingOtps = 0;
  let planName: string | null = null;
  let hasSubscription = !!sub;
  if (sub) {
    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, sub.planId)).limit(1);
    if (plan) {
      remainingOtps = Math.max(0, plan.otpLimit - sub.otpUsed);
      planName = plan.name;
    }
  }

  const [activeKeysResult] = await db.select({ count: count() }).from(apiKeysTable)
    .where(and(eq(apiKeysTable.userId, userId), eq(apiKeysTable.status, "active")));

  const recentActivity = await db.select().from(otpRequestsTable)
    .where(eq(otpRequestsTable.userId, userId))
    .orderBy(sql`${otpRequestsTable.createdAt} DESC`)
    .limit(10);

  return res.json({
    otpSentToday: otpTodayResult?.count ?? 0,
    otpSentMonth: otpMonthResult?.count ?? 0,
    otpSuccessRate: successRate,
    remainingOtps,
    planName,
    hasSubscription,
    activeApiKeys: activeKeysResult?.count ?? 0,
    recentActivity: recentActivity.map(l => ({
      id: l.id,
      phoneNumber: l.phoneNumber,
      status: l.status,
      requestId: l.requestId,
      country: l.country,
      createdAt: l.createdAt,
    })),
  });
});

// Admin: paginated OTP logs across all users
router.get("/admin/otp-logs", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const statusFilter = req.query.status as string | undefined;

  const baseQuery = db.select({
    id: otpRequestsTable.id,
    requestId: otpRequestsTable.requestId,
    phoneNumber: otpRequestsTable.phoneNumber,
    status: otpRequestsTable.status,
    country: otpRequestsTable.country,
    createdAt: otpRequestsTable.createdAt,
    userId: otpRequestsTable.userId,
    userEmail: usersTable.email,
    userName: usersTable.name,
  })
    .from(otpRequestsTable)
    .innerJoin(usersTable, eq(otpRequestsTable.userId, usersTable.id));

  const rows = statusFilter
    ? await baseQuery.where(eq(otpRequestsTable.status, statusFilter)).orderBy(sql`${otpRequestsTable.createdAt} DESC`).limit(limit).offset(offset)
    : await baseQuery.orderBy(sql`${otpRequestsTable.createdAt} DESC`).limit(limit).offset(offset);

  return res.json(rows);
});

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const [totalUsersResult] = await db.select({ count: count() }).from(usersTable);
  const [activeSubsResult] = await db.select({ count: count() }).from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "active"));
  const [totalOtpResult] = await db.select({ count: count() }).from(otpRequestsTable);
  const [connectedResult] = await db.select({ count: count() }).from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.status, "connected"));

  // Revenue: sum of plan prices for active subscriptions
  const activeSubs = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "active"));

  let revenue = 0;
  for (const sub of activeSubs) {
    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, sub.planId)).limit(1);
    if (plan) revenue += plan.price;
  }

  // OTP by country
  const otpLogs = await db.select().from(otpRequestsTable);
  const countryMap: Record<string, number> = {};
  for (const log of otpLogs) {
    const c = log.country || "unknown";
    countryMap[c] = (countryMap[c] || 0) + 1;
  }
  const otpByCountry = Object.entries(countryMap).map(([country, count]) => ({ country, count }));

  // Recent users
  const recentUsers = await db.select().from(usersTable)
    .orderBy(sql`${usersTable.createdAt} DESC`)
    .limit(5);

  return res.json({
    totalUsers: totalUsersResult?.count ?? 0,
    activeSubscriptions: activeSubsResult?.count ?? 0,
    totalOtpSent: totalOtpResult?.count ?? 0,
    connectedNumbers: connectedResult?.count ?? 0,
    revenue,
    recentUsers: recentUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      suspended: u.suspended,
      createdAt: u.createdAt,
    })),
    otpByCountry,
  });
});

export default router;
