import { Router } from "express";
import { randomBytes } from "crypto";
import { db, otpRequestsTable, subscriptionsTable, plansTable, whatsappNumbersTable } from "@workspace/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { requireAuth, requireApiKey, type AuthRequest } from "../middlewares/auth";
import { sendOtpMessage } from "../lib/baileys-manager";

const router = Router();

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateRequestId(): string {
  return `otp_${randomBytes(16).toString("hex")}`;
}

function detectCountry(phoneNumber: string): string | null {
  if (phoneNumber.startsWith("+1")) return "us";
  if (phoneNumber.startsWith("+44")) return "uk";
  if (phoneNumber.startsWith("+234")) return "ng";
  return null;
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────
//
// Body:
//   phoneNumber   string   required   Destination phone number (E.164 format, e.g. +2348012345678)
//   template      string   optional   Custom message with {{code}} placeholder
//   senderNumberId number  optional   ID of a specific WhatsApp number to use as sender
//                                     (must be a pool number or one owned by the calling user)
//
router.post("/otp/send", requireApiKey, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { phoneNumber, template, senderNumberId } = req.body;

  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  // Validate E.164 format
  if (!/^\+[1-9]\d{6,14}$/.test(phoneNumber)) {
    return res.status(400).json({ error: "phoneNumber must be in E.164 format (e.g. +2348012345678)" });
  }

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

  const country = detectCountry(phoneNumber);

  // ── Resolve sender number ──────────────────────────────────────────────────
  let resolvedSender: { id: number } | undefined;

  if (senderNumberId) {
    // Caller specified a preferred sender — validate it
    const [requested] = await db
      .select()
      .from(whatsappNumbersTable)
      .where(eq(whatsappNumbersTable.id, senderNumberId))
      .limit(1);

    if (!requested) {
      return res.status(400).json({ error: "senderNumberId not found" });
    }

    const isOwnedByUser = requested.ownerId === userId;
    const isPoolNumber = requested.ownerId === null;

    if (!isOwnedByUser && !isPoolNumber) {
      return res.status(403).json({ error: "You do not have access to that sender number" });
    }

    if (requested.status !== "connected" || !requested.sessionActive) {
      return res.status(422).json({ error: "The requested sender number is not connected" });
    }

    resolvedSender = { id: requested.id };
  } else {
    // Auto-select: prefer user's own number, fall back to pool
    const [userNumber] = await db
      .select()
      .from(whatsappNumbersTable)
      .where(and(eq(whatsappNumbersTable.ownerId, userId), eq(whatsappNumbersTable.status, "connected")))
      .limit(1);

    if (userNumber && userNumber.sessionActive) {
      resolvedSender = { id: userNumber.id };
    } else {
      const poolNumbers = await db
        .select()
        .from(whatsappNumbersTable)
        .where(isNull(whatsappNumbersTable.ownerId));

      const connected = poolNumbers.find(n => n.status === "connected" && n.sessionActive);
      if (connected) resolvedSender = { id: connected.id };
    }
  }

  // ── Generate code + message ────────────────────────────────────────────────
  const code = generateOtpCode();
  const requestId = generateRequestId();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const otpMessage = template
    ? template.replace("{{code}}", code)
    : `Your WhatOTP verification code is: *${code}*\n\nValid for 10 minutes. Do not share this code with anyone.`;

  // ── Send ───────────────────────────────────────────────────────────────────
  const result = await sendOtpMessage(phoneNumber, otpMessage, resolvedSender?.id);

  const senderNumberId_used = result.success ? result.numberId : (resolvedSender?.id ?? null);
  const status = result.success ? "sent" : "failed";

  await db.insert(otpRequestsTable).values({
    userId,
    requestId,
    phoneNumber,
    code,
    status,
    country,
    whatsappNumberId: senderNumberId_used ?? null,
    expiresAt,
  });

  if (status === "sent") {
    await db.update(subscriptionsTable)
      .set({ otpUsed: sub.otpUsed + 1 })
      .where(eq(subscriptionsTable.id, sub.id));

    if (senderNumberId_used) {
      await db.update(whatsappNumbersTable)
        .set({ otpSentCount: sql`${whatsappNumbersTable.otpSentCount} + 1` })
        .where(eq(whatsappNumbersTable.id, senderNumberId_used));
    }
  }

  if (status === "failed") {
    return res.status(503).json({
      error: "No WhatsApp numbers are connected. Please link a number in the admin panel.",
    });
  }

  return res.json({
    requestId,
    expiresAt: expiresAt.toISOString(),
    message: `OTP sent to ${phoneNumber}`,
  });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────

router.post("/otp/verify", requireApiKey, async (req: AuthRequest, res) => {
  const { requestId, code } = req.body;
  if (!requestId || !code) return res.status(400).json({ error: "requestId and code are required" });

  const [otpRequest] = await db.select().from(otpRequestsTable)
    .where(eq(otpRequestsTable.requestId, requestId)).limit(1);

  if (!otpRequest) return res.status(404).json({ error: "OTP request not found" });
  if (otpRequest.status === "verified") return res.json({ valid: false, message: "OTP already used" });
  if (otpRequest.status === "expired" || new Date() > otpRequest.expiresAt) {
    await db.update(otpRequestsTable).set({ status: "expired" }).where(eq(otpRequestsTable.id, otpRequest.id));
    return res.json({ valid: false, message: "OTP expired" });
  }
  if (otpRequest.code !== code) return res.json({ valid: false, message: "Invalid OTP code" });

  await db.update(otpRequestsTable).set({ status: "verified" }).where(eq(otpRequestsTable.id, otpRequest.id));
  return res.json({ valid: true, message: "OTP verified successfully" });
});

// ─── OTP Logs ─────────────────────────────────────────────────────────────────

router.get("/otp/logs", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const statusFilter = req.query.status as string | undefined;

  const validStatuses = ["sent", "verified", "failed", "expired"];
  const effectiveStatus = statusFilter && validStatuses.includes(statusFilter) ? statusFilter : undefined;

  const baseWhere = effectiveStatus
    ? and(eq(otpRequestsTable.userId, userId), eq(otpRequestsTable.status, effectiveStatus))
    : eq(otpRequestsTable.userId, userId);

  const logs = await db.select().from(otpRequestsTable)
    .where(baseWhere)
    .limit(limit)
    .offset(offset)
    .orderBy(sql`${otpRequestsTable.createdAt} DESC`);

  return res.json(logs.map(l => ({
    id: l.id,
    phoneNumber: l.phoneNumber,
    status: l.status,
    requestId: l.requestId,
    country: l.country,
    createdAt: l.createdAt,
    expiresAt: l.expiresAt,
  })));
});

export default router;
