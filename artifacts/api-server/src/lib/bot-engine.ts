import { db, botConfigsTable, botConversationsTable, whatsappNumbersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

type ChatMessage = { role: "user" | "assistant"; content: string };

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(
  apiKey: string, model: string, systemPrompt: string,
  history: ChatMessage[], userMessage: string, maxTokens: number,
): Promise<string> {
  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    ...history,
    { role: "user", content: userMessage },
  ];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error?.message || "OpenAI API error");
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(
  apiKey: string, model: string, systemPrompt: string,
  history: ChatMessage[], userMessage: string, maxTokens: number,
): Promise<string> {
  const contents = [
    ...history.map(h => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const body: any = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
  };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
  const modelId = model.startsWith("models/") ? model : `models/${model}`;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error?.message || "Gemini API error");
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// ─── Business hours check ─────────────────────────────────────────────────────

function isWithinBusinessHours(start: string, end: string, timezone: string): boolean {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false });
    const [h, m] = timeStr.split(":").map(Number);
    const currentMins = h * 60 + m;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return currentMins >= sh * 60 + sm && currentMins <= eh * 60 + em;
  } catch {
    return true; // Default to open if timezone parsing fails
  }
}

// ─── Webhook forward ──────────────────────────────────────────────────────────

async function forwardToWebhook(webhookUrl: string, payload: object): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AchekOTP-Event": "message.incoming" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err: any) {
    console.warn("[BotEngine] Webhook delivery failed:", err.message);
  }
}

// ─── Language system prompt injector ─────────────────────────────────────────

const LANGUAGE_HINTS: Record<string, string> = {
  en: "",
  ha: "Always respond in Hausa language.",
  yo: "Always respond in Yoruba language.",
  ig: "Always respond in Igbo language.",
  pcm: "Always respond in Nigerian Pidgin English.",
  fr: "Always respond in French.",
};

// ─── Test (no DB writes) ───────────────────────────────────────────────────────

export async function testBotMessage(
  provider: string, apiKey: string, model: string,
  systemPrompt: string, userMessage: string, maxTokens = 500, language = "en",
): Promise<string> {
  const langHint = LANGUAGE_HINTS[language] || "";
  const fullPrompt = [systemPrompt, langHint].filter(Boolean).join("\n\n");
  if (provider === "gemini") return callGemini(apiKey, model, fullPrompt, [], userMessage, maxTokens);
  return callOpenAI(apiKey, model, fullPrompt, [], userMessage, maxTokens);
}

// ─── Main incoming message handler ───────────────────────────────────────────

export async function handleIncomingMessage(numberId: number, fromJid: string, text: string): Promise<void> {
  const senderPhone = "+" + fromJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");

  const [whatsappNumber] = await db.select().from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.id, numberId)).limit(1);
  if (!whatsappNumber?.ownerId) return;

  const [botConfig] = await db.select().from(botConfigsTable)
    .where(and(eq(botConfigsTable.userId, whatsappNumber.ownerId), eq(botConfigsTable.enabled, true)))
    .limit(1);
  if (!botConfig) return;

  // ── Webhook forward (always, even if no AI key) ────────────────────────────
  if (botConfig.webhookUrl) {
    forwardToWebhook(botConfig.webhookUrl, {
      event: "message.incoming",
      phone: senderPhone,
      message: text,
      numberId,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }

  if (!botConfig.apiKey) return;

  // ── Business hours check ───────────────────────────────────────────────────
  if (botConfig.businessHoursEnabled) {
    const open = isWithinBusinessHours(
      botConfig.businessHoursStart,
      botConfig.businessHoursEnd,
      botConfig.businessHoursTimezone,
    );
    if (!open) {
      const msg = botConfig.outsideHoursMessage ||
        `Hi! We're currently outside our business hours (${botConfig.businessHoursStart}–${botConfig.businessHoursEnd}). We'll get back to you soon.`;
      const { sendTextToJid } = await import("./baileys-manager");
      // Only send outside-hours once per session hour (don't spam)
      await sendTextToJid(numberId, fromJid, msg);
      return;
    }
  }

  // ── Human handoff keyword ─────────────────────────────────────────────────
  if (botConfig.handoffKeyword && text.toLowerCase().includes(botConfig.handoffKeyword.toLowerCase())) {
    const msg = botConfig.handoffMessage || "Connecting you to a human agent. Please wait...";
    const { sendTextToJid } = await import("./baileys-manager");
    await sendTextToJid(numberId, fromJid, msg);
    if (botConfig.webhookUrl) {
      forwardToWebhook(botConfig.webhookUrl, {
        event: "handoff.requested",
        phone: senderPhone,
        message: text,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }
    return;
  }

  // ── Get conversation history ───────────────────────────────────────────────
  const history = await db.select().from(botConversationsTable)
    .where(and(
      eq(botConversationsTable.botConfigId, botConfig.id),
      eq(botConversationsTable.sessionId, senderPhone),
    ))
    .orderBy(desc(botConversationsTable.createdAt))
    .limit(20);

  const historyMessages: ChatMessage[] = history.reverse().map(h => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));

  // ── Build system prompt with language hint ────────────────────────────────
  const langHint = LANGUAGE_HINTS[botConfig.language] || "";
  const fullSystemPrompt = [botConfig.systemPrompt, langHint].filter(Boolean).join("\n\n");

  // ── Welcome message on first contact ─────────────────────────────────────
  if (historyMessages.length === 0 && botConfig.welcomeMessage) {
    const { sendTextToJid } = await import("./baileys-manager");
    if (botConfig.responseDelayMs > 0) await new Promise(r => setTimeout(r, botConfig.responseDelayMs));
    await sendTextToJid(numberId, fromJid, botConfig.welcomeMessage);
    await new Promise(r => setTimeout(r, 800));
  }

  // ── Call AI ───────────────────────────────────────────────────────────────
  let reply: string;
  try {
    if (botConfig.responseDelayMs > 0) {
      await new Promise(r => setTimeout(r, botConfig.responseDelayMs));
    }

    if (botConfig.provider === "gemini") {
      reply = await callGemini(
        botConfig.apiKey, botConfig.model || "gemini-1.5-flash",
        fullSystemPrompt, historyMessages, text, botConfig.maxTokens || 500,
      );
    } else {
      reply = await callOpenAI(
        botConfig.apiKey, botConfig.model || "gpt-4o-mini",
        fullSystemPrompt, historyMessages, text, botConfig.maxTokens || 500,
      );
    }
  } catch (err: any) {
    console.error("[BotEngine] AI call failed:", err.message);
    if (botConfig.fallbackMessage) {
      const { sendTextToJid } = await import("./baileys-manager");
      await sendTextToJid(numberId, fromJid, botConfig.fallbackMessage);
    }
    return;
  }

  if (!reply) return;

  // ── Persist + send ────────────────────────────────────────────────────────
  await db.insert(botConversationsTable).values([
    { botConfigId: botConfig.id, sessionId: senderPhone, role: "user", content: text },
    { botConfigId: botConfig.id, sessionId: senderPhone, role: "assistant", content: reply },
  ]);

  await db.update(botConfigsTable)
    .set({ totalMessages: (botConfig.totalMessages || 0) + 1 })
    .where(eq(botConfigsTable.id, botConfig.id));

  const { sendTextToJid } = await import("./baileys-manager");
  await sendTextToJid(numberId, fromJid, reply);

  // Forward AI reply to webhook too
  if (botConfig.webhookUrl) {
    forwardToWebhook(botConfig.webhookUrl, {
      event: "message.outgoing",
      phone: senderPhone,
      message: reply,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }
}
