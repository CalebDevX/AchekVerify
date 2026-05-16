import { Router } from "express";
import { db, botConfigsTable, botConversationsTable, broadcastsTable, whatsappNumbersTable } from "@workspace/db";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { testBotMessage } from "../lib/bot-engine";
import { sendOtpMessage } from "../lib/baileys-manager";

const router = Router();

// ─── Helper: strip API key ────────────────────────────────────────────────────
function safeConfig(c: any) {
  return { ...c, apiKey: c.apiKey ? "**SET**" : null, hasApiKey: !!c.apiKey };
}

// ─── Get bot config ───────────────────────────────────────────────────────────
router.get("/bot/config", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);
  return res.json(config ? safeConfig(config) : null);
});

// ─── Create / Update bot config ───────────────────────────────────────────────
router.put("/bot/config", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const {
    enabled, provider, apiKey, model, botName, systemPrompt,
    welcomeMessage, fallbackMessage, features, maxTokens,
    webhookUrl, language, businessHoursEnabled, businessHoursStart,
    businessHoursEnd, businessHoursTimezone, outsideHoursMessage,
    handoffKeyword, handoffMessage, responseDelayMs, typingIndicatorEnabled,
  } = req.body;

  const [existing] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);

  const values: Record<string, any> = {};
  if (enabled !== undefined) values.enabled = enabled;
  if (provider !== undefined) values.provider = provider;
  if (model !== undefined) values.model = model;
  if (botName !== undefined) values.botName = botName;
  if (systemPrompt !== undefined) values.systemPrompt = systemPrompt;
  if (welcomeMessage !== undefined) values.welcomeMessage = welcomeMessage;
  if (fallbackMessage !== undefined) values.fallbackMessage = fallbackMessage;
  if (features !== undefined) values.features = JSON.stringify(features);
  if (maxTokens !== undefined) values.maxTokens = maxTokens;
  if (webhookUrl !== undefined) values.webhookUrl = webhookUrl || null;
  if (language !== undefined) values.language = language;
  if (businessHoursEnabled !== undefined) values.businessHoursEnabled = businessHoursEnabled;
  if (businessHoursStart !== undefined) values.businessHoursStart = businessHoursStart;
  if (businessHoursEnd !== undefined) values.businessHoursEnd = businessHoursEnd;
  if (businessHoursTimezone !== undefined) values.businessHoursTimezone = businessHoursTimezone;
  if (outsideHoursMessage !== undefined) values.outsideHoursMessage = outsideHoursMessage;
  if (handoffKeyword !== undefined) values.handoffKeyword = handoffKeyword || null;
  if (handoffMessage !== undefined) values.handoffMessage = handoffMessage;
  if (responseDelayMs !== undefined) values.responseDelayMs = responseDelayMs;
  if (typingIndicatorEnabled !== undefined) values.typingIndicatorEnabled = typingIndicatorEnabled;
  if (apiKey && apiKey !== "**SET**") values.apiKey = apiKey;

  if (existing) {
    const [updated] = await db.update(botConfigsTable).set(values)
      .where(eq(botConfigsTable.id, existing.id)).returning();
    return res.json(safeConfig(updated));
  }
  const [created] = await db.insert(botConfigsTable).values({ userId, ...values }).returning();
  return res.status(201).json(safeConfig(created));
});

// ─── Test bot ─────────────────────────────────────────────────────────────────
router.post("/bot/test", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);
  if (!config) return res.status(404).json({ error: "Bot not configured yet" });
  if (!config.apiKey) return res.status(422).json({ error: "No API key configured for the bot" });

  try {
    const reply = await testBotMessage(
      config.provider, config.apiKey, config.model || "gpt-4o-mini",
      config.systemPrompt || "", message, config.maxTokens || 500, config.language,
    );
    return res.json({ reply });
  } catch (err: any) {
    return res.status(502).json({ error: err.message || "AI provider error" });
  }
});

// ─── Conversation sessions ────────────────────────────────────────────────────
router.get("/bot/sessions", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);
  if (!config) return res.json([]);

  const allMessages = await db.select().from(botConversationsTable)
    .where(eq(botConversationsTable.botConfigId, config.id))
    .orderBy(desc(botConversationsTable.createdAt))
    .limit(500);

  const sessionsMap = new Map<string, any>();
  for (const msg of allMessages) {
    if (!sessionsMap.has(msg.sessionId)) {
      sessionsMap.set(msg.sessionId, {
        phone: msg.sessionId,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        lastRole: msg.role,
      });
    }
  }
  return res.json(Array.from(sessionsMap.values()));
});

// ─── Get conversation for a phone ────────────────────────────────────────────
router.get("/bot/conversations/:phone", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const phone = decodeURIComponent(req.params.phone as string);
  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);
  if (!config) return res.json([]);

  const messages = await db.select().from(botConversationsTable)
    .where(and(
      eq(botConversationsTable.botConfigId, config.id),
      eq(botConversationsTable.sessionId, phone),
    ))
    .orderBy(desc(botConversationsTable.createdAt))
    .limit(100);
  return res.json(messages.reverse());
});

// ─── Reply to a conversation (admin sends message via WhatsApp) ───────────────
router.post("/bot/conversations/:phone/reply", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const phone = decodeURIComponent(req.params.phone as string);
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);
  if (!config) return res.status(404).json({ error: "Bot not configured" });

  // Find the user's dedicated WhatsApp number
  const [number] = await db.select().from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) return res.status(404).json({ error: "No dedicated WhatsApp number connected" });

  const { sendTextToJid } = await import("../lib/baileys-manager");
  const jid = phone.replace(/\D/g, "") + "@s.whatsapp.net";
  const ok = await sendTextToJid(number.id, jid, message);

  if (ok) {
    // Save to conversation history
    await db.insert(botConversationsTable).values({
      botConfigId: config.id,
      sessionId: phone,
      role: "assistant",
      content: `[Manual] ${message}`,
    });
    return res.json({ success: true });
  }
  return res.status(502).json({ error: "WhatsApp number is not connected" });
});

// ─── Clear conversation history ───────────────────────────────────────────────
router.delete("/bot/conversations/:phone", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const phone = decodeURIComponent(req.params.phone as string);
  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);
  if (!config) return res.status(404).json({ error: "Bot not configured" });

  await db.delete(botConversationsTable)
    .where(and(
      eq(botConversationsTable.botConfigId, config.id),
      eq(botConversationsTable.sessionId, phone),
    ));
  return res.json({ success: true });
});

// ─── Broadcasts: create & send ────────────────────────────────────────────────
router.get("/broadcasts", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const broadcasts = await db.select().from(broadcastsTable)
    .where(eq(broadcastsTable.userId, userId))
    .orderBy(desc(broadcastsTable.createdAt))
    .limit(50);
  return res.json(broadcasts.map(b => ({ ...b, recipients: JSON.parse(b.recipients || "[]") })));
});

router.post("/broadcasts", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { name, message, recipients } = req.body;
  if (!name || !message || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "name, message, and recipients[] are required" });
  }
  if (recipients.length > 1000) {
    return res.status(400).json({ error: "Maximum 1000 recipients per broadcast" });
  }

  const [number] = await db.select().from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.ownerId, userId)).limit(1);
  if (!number) {
    return res.status(422).json({ error: "You need a dedicated WhatsApp number to send broadcasts" });
  }

  const [broadcast] = await db.insert(broadcastsTable).values({
    userId,
    name,
    message,
    recipients: JSON.stringify(recipients),
    total: recipients.length,
    status: "sending",
  }).returning();

  // Send in background
  (async () => {
    const { sendOtpMessage } = await import("../lib/baileys-manager");
    let sent = 0;
    let failed = 0;

    for (const phone of recipients) {
      try {
        const ok = await sendOtpMessage(phone, message, number.id);
        if (ok.success) sent++;
        else failed++;
        await new Promise(r => setTimeout(r, 1200)); // rate limiting
      } catch {
        failed++;
      }
    }

    await db.update(broadcastsTable)
      .set({ status: "done", sent, failedCount: failed })
      .where(eq(broadcastsTable.id, broadcast.id));
  })().catch(console.error);

  return res.status(202).json({
    ...broadcast,
    recipients,
    message: `Broadcast queued — sending to ${recipients.length} recipients`,
  });
});

router.get("/broadcasts/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);
  const [broadcast] = await db.select().from(broadcastsTable)
    .where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.userId, userId))).limit(1);
  if (!broadcast) return res.status(404).json({ error: "Broadcast not found" });
  return res.json({ ...broadcast, recipients: JSON.parse(broadcast.recipients || "[]") });
});

export default router;
