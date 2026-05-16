import { db, botConfigsTable, botConversationsTable, whatsappNumbersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

type ChatMessage = { role: "user" | "assistant"; content: string };

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  maxTokens: number,
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
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  const contents = [
    ...history.map(h => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const body: any = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const modelId = model.startsWith("models/") ? model : `models/${model}`;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );

  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error?.message || "Gemini API error");
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// ─── Test (no DB writes) ───────────────────────────────────────────────────────

export async function testBotMessage(
  provider: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 500,
): Promise<string> {
  if (provider === "gemini") {
    return callGemini(apiKey, model, systemPrompt, [], userMessage, maxTokens);
  }
  return callOpenAI(apiKey, model, systemPrompt, [], userMessage, maxTokens);
}

// ─── Incoming message handler ─────────────────────────────────────────────────

export async function handleIncomingMessage(numberId: number, fromJid: string, text: string): Promise<void> {
  const senderPhone = "+" + fromJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");

  const [whatsappNumber] = await db.select().from(whatsappNumbersTable)
    .where(eq(whatsappNumbersTable.id, numberId)).limit(1);

  if (!whatsappNumber?.ownerId) return; // Pool numbers don't have bot support

  const [botConfig] = await db.select().from(botConfigsTable)
    .where(and(eq(botConfigsTable.userId, whatsappNumber.ownerId), eq(botConfigsTable.enabled, true)))
    .limit(1);

  if (!botConfig || !botConfig.apiKey) return;

  // Get conversation history (last 20 messages, chronological)
  const history = await db.select().from(botConversationsTable)
    .where(and(
      eq(botConversationsTable.botConfigId, botConfig.id),
      eq(botConversationsTable.sessionId, senderPhone),
    ))
    .orderBy(desc(botConversationsTable.createdAt))
    .limit(20);

  const historyMessages: ChatMessage[] = history
    .reverse()
    .map(h => ({ role: h.role as "user" | "assistant", content: h.content }));

  let reply: string;
  try {
    if (botConfig.provider === "gemini") {
      reply = await callGemini(
        botConfig.apiKey, botConfig.model || "gemini-1.5-flash",
        botConfig.systemPrompt || "", historyMessages, text, botConfig.maxTokens || 500,
      );
    } else {
      reply = await callOpenAI(
        botConfig.apiKey, botConfig.model || "gpt-4o-mini",
        botConfig.systemPrompt || "", historyMessages, text, botConfig.maxTokens || 500,
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

  // Persist conversation
  await db.insert(botConversationsTable).values([
    { botConfigId: botConfig.id, sessionId: senderPhone, role: "user", content: text },
    { botConfigId: botConfig.id, sessionId: senderPhone, role: "assistant", content: reply },
  ]);

  // Increment message counter
  await db.update(botConfigsTable)
    .set({ totalMessages: (botConfig.totalMessages || 0) + 1 })
    .where(eq(botConfigsTable.id, botConfig.id));

  // Send response
  const { sendTextToJid } = await import("./baileys-manager");
  await sendTextToJid(numberId, fromJid, reply);
}
