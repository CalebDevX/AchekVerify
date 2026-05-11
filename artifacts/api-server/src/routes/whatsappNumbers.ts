import { Router } from "express";
import { db, whatsappNumbersTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";
import { requireAdmin, requireAuth, type AuthRequest } from "../middlewares/auth";
import { startSession, stopSession, getSessionState, updateDisplayName } from "../lib/baileys-manager";

const router = Router();

// ─── Admin: shared pool numbers ─────────────────────────────────────────────

router.get("/admin/whatsapp-numbers", requireAdmin, async (_req, res) => {
  const numbers = await db.select().from(whatsappNumbersTable).where(isNull(whatsappNumbersTable.ownerId));
  return res.json(numbers.map(n => {
    const live = getSessionState(n.id);
    return {
      id: n.id, phoneNumber: n.phoneNumber, country: n.country, label: n.label,
      status: live.status, sessionActive: live.connected, otpSentCount: n.otpSentCount, createdAt: n.createdAt,
    };
  }));
});

router.post("/admin/whatsapp-numbers", requireAdmin, async (req: AuthRequest, res) => {
  const { phoneNumber, country, label } = req.body;
  if (!phoneNumber || !country) return res.status(400).json({ error: "phoneNumber and country are required" });
  if (!["us", "ng", "uk"].includes(country)) return res.status(400).json({ error: "country must be us, ng, or uk" });

  const [number] = await db.insert(whatsappNumbersTable).values({ phoneNumber, country, label: label || null }).returning();
  req.log.info({ numberId: number.id }, "Admin added WhatsApp number");
  return res.status(201).json({
    id: number.id, phoneNumber: number.phoneNumber, country: number.country, label: number.label,
    status: number.status, sessionActive: number.sessionActive, otpSentCount: number.otpSentCount, createdAt: number.createdAt,
  });
});

router.get("/admin/whatsapp-numbers/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id)).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });
  const live = getSessionState(id);
  return res.json({
    id: number.id, phoneNumber: number.phoneNumber, country: number.country, label: number.label,
    status: live.status, sessionActive: live.connected, otpSentCount: number.otpSentCount, createdAt: number.createdAt,
  });
});

router.delete("/admin/whatsapp-numbers/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id)).limit(1);
  if (!number) return res.status(404).json({ error: "Number not found" });
  await stopSession(id);
  await db.delete(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, id));
  return res.json({ success: true, message: "Number deleted" });
});

// GET QR — starts a Baileys session if not running, returns live QR data URL
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

router.post("/admin/whatsapp-numbers/:id/disconnect", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  await stopSession(id);
  return res.json({ success: true, message: "Session disconnected" });
});

// Update WhatsApp display name for a number
router.post("/admin/whatsapp-numbers/:id/name", requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string);
  const displayName = typeof req.body.displayName === "string" ? req.body.displayName.trim() : "";
  if (!displayName || displayName.length > 25) return res.status(400).json({ error: "displayName is required (max 25 chars)" });

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

// ─── User: custom number (Business / Enterprise plans) ─────────────────────

router.get("/user/whatsapp-number", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.json(null);
  const state = getSessionState(number.id);
  return res.json({
    id: number.id, phoneNumber: number.phoneNumber, country: number.country, label: number.label,
    status: state.status, sessionActive: state.connected, otpSentCount: number.otpSentCount, createdAt: number.createdAt,
  });
});

router.post("/user/whatsapp-number", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { phoneNumber, label } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  const [existing] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (existing) return res.status(400).json({ error: "You already have a custom number linked" });

  let country = "ng";
  if (phoneNumber.startsWith("+1")) country = "us";
  else if (phoneNumber.startsWith("+44")) country = "uk";

  const [number] = await db.insert(whatsappNumbersTable).values({
    phoneNumber, country, label: label || "My Number", ownerId: userId,
  }).returning();

  return res.status(201).json({
    id: number.id, phoneNumber: number.phoneNumber, country: number.country, label: number.label,
    status: number.status, sessionActive: number.sessionActive, otpSentCount: number.otpSentCount, createdAt: number.createdAt,
  });
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

router.delete("/user/whatsapp-number", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.status(404).json({ error: "No custom number found" });
  await stopSession(number.id);
  await db.delete(whatsappNumbersTable).where(eq(whatsappNumbersTable.id, number.id));
  return res.json({ success: true });
});

// User requests a display name change on their own number
router.post("/user/whatsapp-number/name", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const displayName = typeof req.body.displayName === "string" ? req.body.displayName.trim() : "";
  if (!displayName || displayName.length > 25) return res.status(400).json({ error: "displayName is required (max 25 chars)" });

  const [number] = await db.select().from(whatsappNumbersTable).where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.status(404).json({ error: "No custom number registered. Upgrade to Business plan and link a number first." });

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
