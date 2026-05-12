import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, whatsappNumbersTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";
import { signToken, requireAuth, type AuthRequest } from "../middlewares/auth";
import { sendOtpMessage } from "../lib/baileys-manager";

const router = Router();

const phoneOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatUserResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    suspended: user.suspended,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res) => {
  const { email, password, name, phoneNumber } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: "user",
    suspended: false,
    phoneNumber: phoneNumber || null,
    phoneVerified: false,
  }).returning();

  const token = signToken(user.id);
  return res.status(201).json({ user: formatUserResponse(user), token });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (user.suspended) {
    return res.status(403).json({ error: "Account suspended" });
  }

  const token = signToken(user.id);
  return res.json({ user: formatUserResponse(user), token });
});

router.post("/auth/logout", (_req, res) => {
  return res.json({ success: true, message: "Logged out" });
});

router.get("/auth/me", requireAuth, (req: AuthRequest, res) => {
  return res.json(req.user);
});

// Send WhatsApp OTP to verify user's phone number
router.post("/auth/verify-phone/send", requireAuth, async (req: AuthRequest, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  const existing = phoneOtpStore.get(phoneNumber);
  if (existing && existing.expiresAt > Date.now() && existing.attempts >= 3) {
    return res.status(429).json({ error: "Too many OTP requests. Please wait before trying again." });
  }

  const code = generateOtpCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const poolNumbers = await db.select().from(whatsappNumbersTable).where(isNull(whatsappNumbersTable.ownerId));
  const sender = poolNumbers.find(n => n.status === "connected" && n.sessionActive);

  const message = `Your WhatOTP phone verification code is: *${code}*\n\nValid for 10 minutes. Do not share this code with anyone.`;
  const result = await sendOtpMessage(phoneNumber, message, sender?.id);

  phoneOtpStore.set(phoneNumber, { code, expiresAt, attempts: (existing?.attempts || 0) + 1 });

  if (!result.success) {
    return res.status(503).json({
      error: "No WhatsApp sender available. Please ask admin to connect a WhatsApp number.",
    });
  }

  return res.json({ message: `Verification code sent to ${phoneNumber}` });
});

// Confirm WhatsApp OTP to verify phone
router.post("/auth/verify-phone/confirm", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { phoneNumber, code } = req.body;
  if (!phoneNumber || !code) return res.status(400).json({ error: "phoneNumber and code are required" });

  const stored = phoneOtpStore.get(phoneNumber);
  if (!stored) {
    return res.status(400).json({ error: "No OTP found for this number. Please request a new code." });
  }
  if (Date.now() > stored.expiresAt) {
    phoneOtpStore.delete(phoneNumber);
    return res.status(400).json({ error: "OTP expired. Please request a new code." });
  }
  if (stored.code !== code) {
    return res.status(400).json({ error: "Invalid OTP code" });
  }

  await db.update(usersTable).set({ phoneNumber, phoneVerified: true }).where(eq(usersTable.id, userId));
  phoneOtpStore.delete(phoneNumber);

  return res.json({ success: true, message: "Phone number verified successfully" });
});

// Update phone number
router.post("/auth/update-phone", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  await db.update(usersTable).set({ phoneNumber, phoneVerified: false }).where(eq(usersTable.id, userId));
  return res.json({ success: true, message: "Phone number updated. Please verify it." });
});

export default router;
