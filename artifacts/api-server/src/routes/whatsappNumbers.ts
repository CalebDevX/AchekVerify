import { Router } from "express";
import { db, whatsappNumbersTable } from "@workspace/db";
import { eq, isNull, and } from "drizzle-orm";
import { requireAdmin, requireAuth, type AuthRequest } from "../middlewares/auth";
import { startSession, stopSession, getSessionState, updateDisplayName } from "../lib/baileys-manager";

const router = Router();

const SUPPORTED_COUNTRIES = ["us", "ng", "uk", "gh", "za", "ke", "eg", "in", "au", "ca"];

function detectCountry(phoneNumber: string): string {
  if (phoneNumber.startsWith("+1")) return "us";
  if (phoneNumber.startsWith("+44")) return "uk";
  if (phoneNumber.startsWith("+234")) return "ng";
  if (phoneNumber.startsWith("+233")) return "gh";
  if (phoneNumber.startsWith("+27")) return "za";
  if (phoneNumber.startsWith("+254")) return "ke";
  if (phoneNumber.startsWith("+20")) return "eg";
  if (phoneNumber.startsWith("+91")) return "in";
  if (phoneNumber.startsWith("+61")) return "au";
  if (phoneNumber.startsWith("+1")) return "ca";
  return "ng";
}

function formatNumber(n: typeof whatsappNumbersTable.$inferSelect, includeSession = true) {
  const live = includeSession ? getSessionState(n.id) : null;
  return {
    id: n.id,
    phoneNumber: n.phoneNumber,
    country: n.country,
    label: n.label,
    status: live ? live.status : n.status,
    sessionActive: live ? live.connected : n.sessionActive,
    otpSentCount: n.otpSentCount,
    ownerId: n.ownerId,
    createdAt: n.createdAt,
  };
}

// ─── Admin: shared pool numbers ───────────────────────────────────────────────

router.get("/admin/whatsapp-numbers", requireAdmin, async (_req, res) => {
  const numbers = await db.select().from(whatsappNumbersTable).where(isNull(whatsappNumbersTable.ownerId));
  return res.json(numbers.map(n => formatNumber(n)));
});

router.post("/admin/whatsapp-numbers", requireAdmin, async (req: AuthRequest, res) => {
  const { phoneNumber, country, label } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  const resolvedCountry = country || detectCountry(phoneNumber);
  if (!SUPPORTED_COUNTRIES.includes(resolvedCountry)) {
    return res.status(400).json({ error: `country must be one of: ${SUPPORTED_COUNTRIES.join(", ")}` });
  }

  // Prevent duplicates
  const [existing] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.phoneNumber, phoneNumber)).limit(1);
  if (existing) return res.status(400).json({ error: "This phone number is already registered" });

  const [number] = await db.insert(whatsappNumbersTable).values({
    phoneNumber,
    country: resolvedCountry,
    label: label || null,
  }).returning();

  req.log.info({ numberId: number.id }, "Admin added WhatsApp pool number");
  return res.status(201).json(formatNumber(number, false));
});

router.get("/admin/whatsapp-numbers/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id)).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });
  return res.json(formatNumber(number));
});

router.delete("/admin/whatsapp-numbers/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id)).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });
  await stopSession(id);
  await db.delete(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id));
  return res.json({ success: true, message: "Number deleted" });
});

router.get("/admin/whatsapp-numbers/:id/qr", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id)).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });

  const state = getSessionState(id);
  if (state.connected) return res.json({ qrCode: null, status: "connected" });

  if (!state.qrDataUrl) {
    startSession(id).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
  }

  const fresh = getSessionState(id);
  return res.json({ qrCode: fresh.qrDataUrl, status: fresh.status });
});

router.post("/admin/whatsapp-numbers/:id/retry-qr", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id)).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });

  await stopSession(id);
  startSession(id).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  const fresh = getSessionState(id);
  return res.json({ qrCode: fresh.qrDataUrl, status: fresh.status, message: "QR retry initiated" });
});

router.post("/admin/whatsapp-numbers/:id/disconnect", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  await stopSession(id);
  return res.json({ success: true, message: "Session disconnected" });
});

router.post("/admin/whatsapp-numbers/:id/name", requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  const displayName = typeof req.body.displayName === "string" ? req.body.displayName.trim() : "";
  if (!displayName || displayName.length > 25) {
    return res.status(400).json({ error: "displayName is required (max 25 chars)" });
  }

  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id)).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });

  const ok = await updateDisplayName(id, displayName);
  if (!ok) {
    return res.status(422).json({
      error: "Cannot update name — the WhatsApp session must be connected first.",
      displayName,
    });
  }
  req.log.info({ numberId: id, displayName }, "WhatsApp display name updated");
  return res.json({ success: true, displayName });
});

router.get("/admin/whatsapp-numbers/:id/status", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id)).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });

  const live = getSessionState(id);
  return res.json({
    id: number.id,
    status: live.status,
    connected: live.connected,
    qrAvailable: !!live.qrDataUrl,
    lastUpdated: new Date().toISOString(),
  });
});

// ─── Admin: view all user-owned numbers ───────────────────────────────────────

router.get("/admin/user-whatsapp-numbers", requireAdmin, async (_req, res) => {
  const { sql: drizzleSql } = await import("drizzle-orm");
  const numbers = await db.select().from(whatsappNumbersTable)
    .where(drizzleSql`${whatsappNumbersTable.ownerId} IS NOT NULL`);
  return res.json(numbers.map(n => formatNumber(n)));
});

// ─── User: multiple custom numbers ────────────────────────────────────────────

// List all of the user's numbers
router.get("/user/whatsapp-numbers", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const numbers = await db.select().from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.ownerId, userId));
  return res.json(numbers.map(n => formatNumber(n)));
});

// Add a new number (no longer capped at 1 — plan restrictions handled at OTP send)
router.post("/user/whatsapp-numbers", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { phoneNumber, label } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  if (!/^\+[1-9]\d{6,14}$/.test(phoneNumber)) {
    return res.status(400).json({ error: "phoneNumber must be in E.164 format (e.g. +2348012345678)" });
  }

  const [existing] = await db.select().from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.phoneNumber, phoneNumber)).limit(1);
  if (existing) return res.status(400).json({ error: "This phone number is already registered" });

  const country = detectCountry(phoneNumber);
  const [number] = await db.insert(whatsappNumbersTable).values({
    phoneNumber,
    country,
    label: label || "My Number",
    ownerId: userId,
  }).returning();

  return res.status(201).json(formatNumber(number, false));
});

// Get single number by ID
router.get("/user/whatsapp-numbers/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable)
    .where(and(eq(whatsappNumbersTable.id, id), eq(whatsappNumbersTable.ownerId, userId))).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });
  return res.json(formatNumber(number));
});

// Delete a specific number
router.delete("/user/whatsapp-numbers/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable)
    .where(and(eq(whatsappNumbersTable.id, id), eq(whatsappNumbersTable.ownerId, userId))).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });
  await stopSession(id);
  await db.delete(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id));
  return res.json({ success: true });
});

// Get QR for a specific number
router.get("/user/whatsapp-numbers/:id/qr", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable)
    .where(and(eq(whatsappNumbersTable.id, id), eq(whatsappNumbersTable.ownerId, userId))).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });

  const state = getSessionState(id);
  if (state.connected) return res.json({ qrCode: null, status: "connected" });

  if (!state.qrDataUrl) {
    startSession(id).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
  }

  const fresh = getSessionState(id);
  return res.json({ qrCode: fresh.qrDataUrl, status: fresh.status });
});

// Retry QR for a specific number
router.post("/user/whatsapp-numbers/:id/retry-qr", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable)
    .where(and(eq(whatsappNumbersTable.id, id), eq(whatsappNumbersTable.ownerId, userId))).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });

  await stopSession(id);
  startSession(id).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  const fresh = getSessionState(id);
  return res.json({ qrCode: fresh.qrDataUrl, status: fresh.status, message: "QR retry initiated" });
});

// Poll status for a specific number
router.get("/user/whatsapp-numbers/:id/status", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable)
    .where(and(eq(whatsappNumbersTable.id, id), eq(whatsappNumbersTable.ownerId, userId))).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });

  const state = getSessionState(id);
  return res.json({
    id: number.id,
    status: state.status,
    connected: state.connected,
    qrAvailable: !!state.qrDataUrl,
    lastUpdated: new Date().toISOString(),
  });
});

// Update display name for a specific number
router.post("/user/whatsapp-numbers/:id/name", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);
  const displayName = typeof req.body.displayName === "string" ? req.body.displayName.trim() : "";
  if (!displayName || displayName.length > 25) {
    return res.status(400).json({ error: "displayName is required (max 25 chars)" });
  }

  const [number] = await db.select().from(whatsappNumbersTable)
    .where(and(eq(whatsappNumbersTable.id, id), eq(whatsappNumbersTable.ownerId, userId))).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found or does not belong to you" });

  const ok = await updateDisplayName(id, displayName);
  if (ok) {
    return res.json({ success: true, displayName, message: "Display name updated successfully." });
  }
  return res.json({
    success: false,
    displayName,
    message: "Session is not connected. Connect your WhatsApp first, then try again.",
  });
});

// ─── Backward-compatible singular aliases ─────────────────────────────────────

router.get("/user/whatsapp-number", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const numbers = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId));
  if (!numbers.length) return res.json(null);
  return res.json(formatNumber(numbers[0]));
});

router.post("/user/whatsapp-number", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { phoneNumber, label } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  if (!/^\+[1-9]\d{6,14}$/.test(phoneNumber)) {
    return res.status(400).json({ error: "phoneNumber must be in E.164 format (e.g. +2348012345678)" });
  }

  const [existing] = await db.select().from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.phoneNumber, phoneNumber)).limit(1);
  if (existing) return res.status(400).json({ error: "This phone number is already registered" });

  const country = detectCountry(phoneNumber);
  const [number] = await db.insert(whatsappNumbersTable).values({
    phoneNumber,
    country,
    label: label || "My Number",
    ownerId: userId,
  }).returning();

  return res.status(201).json(formatNumber(number, false));
});

router.get("/user/whatsapp-number/qr", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.status(404).json({ error: "No custom number registered" });

  const state = getSessionState(number.id);
  if (state.connected) return res.json({ qrCode: null, status: "connected" });

  if (!state.qrDataUrl) {
    startSession(number.id).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
  }

  const fresh = getSessionState(number.id);
  return res.json({ qrCode: fresh.qrDataUrl, status: fresh.status });
});

router.post("/user/whatsapp-number/retry-qr", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.status(404).json({ error: "No custom number registered" });

  await stopSession(number.id);
  startSession(number.id).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  const fresh = getSessionState(number.id);
  return res.json({ qrCode: fresh.qrDataUrl, status: fresh.status, message: "QR retry initiated" });
});

router.delete("/user/whatsapp-number", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.status(404).json({ error: "No custom number found" });
  await stopSession(number.id);
  await db.delete(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, number.id));
  return res.json({ success: true });
});

router.get("/user/whatsapp-number/status", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.json(null);

  const state = getSessionState(number.id);
  return res.json({
    id: number.id,
    status: state.status,
    connected: state.connected,
    qrAvailable: !!state.qrDataUrl,
    lastUpdated: new Date().toISOString(),
  });
});

router.post("/user/whatsapp-number/name", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const displayName = typeof req.body.displayName === "string" ? req.body.displayName.trim() : "";
  if (!displayName || displayName.length > 25) {
    return res.status(400).json({ error: "displayName is required (max 25 chars)" });
  }

  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.status(404).json({ error: "No custom number registered" });

  const ok = await updateDisplayName(number.id, displayName);
  if (ok) {
    return res.json({ success: true, displayName, message: "Display name updated successfully." });
  }
  return res.json({
    success: false,
    displayName,
    message: "Session is not connected. Connect your WhatsApp first, then try again.",
  });
});

export default router;
