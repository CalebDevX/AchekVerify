import { Router } from "express";
import { db, botConfigsTable, botConversationsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { testBotMessage } from "../lib/bot-engine";

const router = Router();

// ─── Get bot config ───────────────────────────────────────────────────────────

router.get("/bot/config", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);

  if (!config) {
    return res.json(null);
  }

  // Never expose the raw API key — only signal presence
  return res.json({
    ...config,
    apiKey: config.apiKey ? "**SET**" : null,
    hasApiKey: !!config.apiKey,
  });
});

// ─── Create / Update bot config ───────────────────────────────────────────────

router.put("/bot/config", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const {
    enabled, provider, apiKey, model,
    botName, systemPrompt, welcomeMessage,
    fallbackMessage, features, maxTokens,
  } = req.body;

  const [existing] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);

  const values: any = {};
  if (enabled !== undefined) values.enabled = enabled;
  if (provider !== undefined) values.provider = provider;
  if (model !== undefined) values.model = model;
  if (botName !== undefined) values.botName = botName;
  if (systemPrompt !== undefined) values.systemPrompt = systemPrompt;
  if (welcomeMessage !== undefined) values.welcomeMessage = welcomeMessage;
  if (fallbackMessage !== undefined) values.fallbackMessage = fallbackMessage;
  if (features !== undefined) values.features = JSON.stringify(features);
  if (maxTokens !== undefined) values.maxTokens = maxTokens;
  // Only update API key if explicitly provided (non-empty string)
  if (apiKey && apiKey !== "**SET**") values.apiKey = apiKey;

  if (existing) {
    const [updated] = await db.update(botConfigsTable).set(values)
      .where(eq(botConfigsTable.id, existing.id)).returning();
    return res.json({ ...updated, apiKey: updated.apiKey ? "**SET**" : null, hasApiKey: !!updated.apiKey });
  } else {
    const [created] = await db.insert(botConfigsTable).values({ userId, ...values }).returning();
    return res.status(201).json({ ...created, apiKey: created.apiKey ? "**SET**" : null, hasApiKey: !!created.apiKey });
  }
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
      config.provider,
      config.apiKey,
      config.model || "gpt-4o-mini",
      config.systemPrompt || "",
      message,
      config.maxTokens || 500,
    );
    return res.json({ reply });
  } catch (err: any) {
    return res.status(502).json({ error: err.message || "AI provider error" });
  }
});

// ─── Clear conversation history for a phone number ───────────────────────────

router.delete("/bot/conversations/:phone", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const phone = req.params.phone as string;

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

// ─── Get conversation sessions ────────────────────────────────────────────────

router.get("/bot/sessions", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);

  if (!config) return res.json([]);

  // Get unique sessions with last message
  const allMessages = await db.select().from(botConversationsTable)
    .where(eq(botConversationsTable.botConfigId, config.id))
    .orderBy(desc(botConversationsTable.createdAt))
    .limit(200);

  const sessionsMap = new Map<string, any>();
  for (const msg of allMessages) {
    if (!sessionsMap.has(msg.sessionId)) {
      sessionsMap.set(msg.sessionId, {
        phone: msg.sessionId,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        role: msg.role,
      });
    }
  }

  return res.json(Array.from(sessionsMap.values()));
});

// ─── Get conversation history for a phone ────────────────────────────────────

router.get("/bot/conversations/:phone", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const phone = req.params.phone as string;

  const [config] = await db.select().from(botConfigsTable)
    .where(eq(botConfigsTable.userId, userId)).limit(1);

  if (!config) return res.json([]);

  const messages = await db.select().from(botConversationsTable)
    .where(and(
      eq(botConversationsTable.botConfigId, config.id),
      eq(botConversationsTable.sessionId, phone),
    ))
    .orderBy(desc(botConversationsTable.createdAt))
    .limit(50);

  return res.json(messages.reverse());
});

export default router;
