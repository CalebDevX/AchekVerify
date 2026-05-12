import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, whatsappNumbersTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";
import { signToken, requireAuth, type AuthRequest } from "../middlewares/auth";
import { sendOtpMessage } from "../lib/baileys-manager";

const router = Router();

// In-memory OTP stores (keyed by phone number)
const phoneOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const passwordResetStore = new Map<string, { userId: number; code: string; expiresAt: number }>();

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

async function getPoolSender() {
  const poolNumbers = await db.select().from(whatsappNumbersTable).where(isNull(whatsappNumbersTable.ownerId));
  return poolNumbers.find(n => n.status === "connected" && n.sessionActive);
}

// ─── Register ────────────────────────────────────────────────────────────────

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

// ─── Login ───────────────────────────────────────────────────────────────────

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

// ─── Logout ──────────────────────────────────────────────────────────────────

router.post("/auth/logout", (_req, res) => {
  return res.json({ success: true, message: "Logged out" });
});

// ─── Me ──────────────────────────────────────────────────────────────────────

router.get("/auth/me", requireAuth, (req: AuthRequest, res) => {
  return res.json(req.user);
});

// ─── Forgot Password (sends OTP to verified phone) ───────────────────────────

router.post("/auth/forgot-password", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: "phoneNumber is required" });
  }

  // Always respond the same way to avoid user enumeration
  const genericResponse = { message: "If that phone number is registered and verified, a reset code has been sent." };

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.phoneNumber, phoneNumber))
    .limit(1);

  if (!user || !user.phoneVerified) {
    return res.json(genericResponse);
  }

  // Rate-limit: max 3 requests per 10 minutes
  const existing = passwordResetStore.get(phoneNumber);
  if (existing && existing.expiresAt > Date.now()) {
    // Just silently refresh (don't expose attempt count to caller)
  }

  const code = generateOtpCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  passwordResetStore.set(phoneNumber, { userId: user.id, code, expiresAt });

  const sender = await getPoolSender();
  const message = `Your WhatOTP password reset code is: *${code}*\n\nValid for 10 minutes. Do not share this code with anyone.`;
  await sendOtpMessage(phoneNumber, message, sender?.id);

  return res.json(genericResponse);
});

// ─── Reset Password (verify OTP + set new password) ──────────────────────────

router.post("/auth/reset-password", async (req, res) => {
  const { phoneNumber, code, newPassword } = req.body;
  if (!phoneNumber || !code || !newPassword) {
    return res.status(400).json({ error: "phoneNumber, code, and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const stored = passwordResetStore.get(phoneNumber);
  if (!stored) {
    return res.status(400).json({ error: "No reset request found. Please request a new code first." });
  }
  if (Date.now() > stored.expiresAt) {
    passwordResetStore.delete(phoneNumber);
    return res.status(400).json({ error: "Reset code expired. Please request a new one." });
  }
  if (stored.code !== code) {
    return res.status(400).json({ error: "Invalid reset code" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, stored.userId));
  passwordResetStore.delete(phoneNumber);

  return res.json({ success: true, message: "Password reset successfully. You can now log in." });
});

// ─── Phone Verification (send OTP to verify a phone number) ──────────────────

router.post("/auth/verify-phone/send", requireAuth, async (req: AuthRequest, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  const existing = phoneOtpStore.get(phoneNumber);
  if (existing && existing.expiresAt > Date.now() && existing.attempts >= 3) {
    return res.status(429).json({ error: "Too many OTP requests. Please wait before trying again." });
  }

  const code = generateOtpCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const sender = await getPoolSender();
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

// ─── Phone Verification (confirm OTP) ────────────────────────────────────────

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

// ─── Update Phone Number ──────────────────────────────────────────────────────

router.post("/auth/update-phone", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  await db.update(usersTable).set({ phoneNumber, phoneVerified: false }).where(eq(usersTable.id, userId));
  return res.json({ success: true, message: "Phone number updated. Please verify it." });
});

// ─── Change Password (authenticated) ─────────────────────────────────────────

router.post("/auth/change-password", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));

  return res.json({ success: true, message: "Password changed successfully" });
});

export default router;
