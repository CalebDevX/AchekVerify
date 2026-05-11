import { Router } from "express";
import { randomBytes } from "crypto";
import { db, otpRequestsTable, subscriptionsTable, plansTable, whatsappNumbersTable } from "@workspace/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { sendOtpMessage } from "../lib/baileys-manager";

const router = Router();

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateRequestId(): string {
  return `otp_${randomBytes(16).toString("hex")}`;
}

// Send OTP
router.post("/otp/send", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { phoneNumber, template } = req.body;

  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  // Check active subscription
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
    .limit(1);

  if (!sub) return res.status(402).json({ error: "No active subscription. Please subscribe to a plan." });

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, sub.planId)).limit(1);
  if (plan && sub.otpUsed >= plan.otpLimit) {
    return res.status(429).json({ error: "OTP limit reached for current billing period" });
  }

  // Determine country from prefix
  let country: string | null = null;
  if (phoneNumber.startsWith("+1")) country = "us";
  else if (phoneNumber.startsWith("+44")) country = "uk";
  else if (phoneNumber.startsWith("+234")) country = "ng";

  // Find the user's custom number if they have one (preferred sender)
  const [customNumber] = await db
    .select()
    .from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.ownerId, userId))
    .limit(1);

  // Also find best pool number for fallback
  const poolNumbers = await db
    .select()
    .from(whatsappNumbersTable)
    .where(isNull(whatsappNumbersTable.ownerId));

  const connectedPool = poolNumbers.find(n => n.status === "connected" && n.sessionActive);

  const code = generateOtpCode();
  const requestId = generateRequestId();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const otpMessage = template
    ? template.replace("{{code}}", code)
    : `Your WhatOTP verification code is: *${code}*\n\nValid for 10 minutes. Do not share this code with anyone.`;

  // Try to send via Baileys — prefer user's custom number, fall back to pool
  const result = await sendOtpMessage(
    phoneNumber,
    otpMessage,
    customNumber?.id ?? connectedPool?.id,
  );

  const senderNumberId = result.success ? result.numberId : (customNumber?.id ?? connectedPool?.id ?? null);
  const status = result.success ? "sent" : "failed";

  const [otpRequest] = await db.insert(otpRequestsTable).values({
    userId,
    requestId,
    phoneNumber,
    code,
    status,
    country,
    whatsappNumberId: senderNumberId ?? null,
    expiresAt,
  }).returning();

  if (status === "sent") {
    await db.update(subscriptionsTable)
      .set({ otpUsed: sub.otpUsed + 1 })
      .where(eq(subscriptionsTable.id, sub.id));

    if (senderNumberId) {
      const senderNum = poolNumbers.find(n => n.id === senderNumberId) ?? customNumber;
      if (senderNum) {
        await db.update(whatsappNumbersTable)
          .set({ otpSentCount: senderNum.otpSentCount + 1 })
          .where(eq(whatsappNumbersTable.id, senderNumberId));
      }
    }
  }

  if (status === "failed") {
    return res.status(503).json({ error: "No WhatsApp numbers connected. Please link a number in the admin panel." });
  }

  return res.json({
    requestId,
    expiresAt: expiresAt.toISOString(),
    message: `OTP sent to ${phoneNumber}`,
  });
});

// Verify OTP
router.post("/otp/verify", requireAuth, async (req: AuthRequest, res) => {
  const { requestId, code } = req.body;
  if (!requestId || !code) return res.status(400).json({ error: "requestId and code are required" });

  const [otpRequest] = await db.select().from(otpRequestsTable)
    .where(eq(otpRequestsTable.requestId, requestId)).limit(1);

  if (!otpRequest) return res.status(400).json({ error: "OTP request not found" });
  if (otpRequest.status === "verified") return res.json({ valid: false, message: "OTP already used" });
  if (otpRequest.status === "expired" || new Date() > otpRequest.expiresAt) {
    await db.update(otpRequestsTable).set({ status: "expired" }).where(eq(otpRequestsTable.id, otpRequest.id));
    return res.json({ valid: false, message: "OTP expired" });
  }
  if (otpRequest.code !== code) return res.json({ valid: false, message: "Invalid OTP code" });

  await db.update(otpRequestsTable).set({ status: "verified" }).where(eq(otpRequestsTable.id, otpRequest.id));
  return res.json({ valid: true, message: "OTP verified successfully" });
});

// OTP Logs
router.get("/otp/logs", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const logs = await db.select().from(otpRequestsTable)
    .where(eq(otpRequestsTable.userId, userId))
    .limit(limit).offset(offset)
    .orderBy(sql`${otpRequestsTable.createdAt} DESC`);

  return res.json(logs.map(l => ({
    id: l.id, phoneNumber: l.phoneNumber, status: l.status,
    requestId: l.requestId, country: l.country, createdAt: l.createdAt,
  })));
});

export default router;
