import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { toDataURL } from "qrcode";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pino from "pino";
import { db, whatsappNumbersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SESSIONS_DIR = join(__dirname, "../../sessions");

if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true });

const baileysLogger = pino({ level: "silent" });

interface SessionState {
  connected: boolean;
  qrDataUrl: string | null;
  qrTimestamp: number;
  socket: ReturnType<typeof makeWASocket> | null;
  reconnectTimer?: ReturnType<typeof setTimeout>;
  sendQueue: Array<{ to: string; message: string; resolve: (v: boolean) => void }>;
  sending: boolean;
}

const sessions = new Map<number, SessionState>();

// Incoming message callback — registered by bot-engine
let incomingMessageHandler: ((numberId: number, fromJid: string, text: string) => void) | null = null;

export function registerIncomingMessageHandler(
  handler: (numberId: number, fromJid: string, text: string) => void,
): void {
  incomingMessageHandler = handler;
}

export function getSessionState(numberId: number): { connected: boolean; qrDataUrl: string | null; status: string } {
  const state = sessions.get(numberId);
  if (!state?.socket) return { connected: false, qrDataUrl: null, status: "disconnected" };
  if (state.connected) return { connected: true, qrDataUrl: null, status: "connected" };
  const expired = Date.now() - state.qrTimestamp > 60_000;
  return {
    connected: false,
    qrDataUrl: expired ? null : state.qrDataUrl,
    status: state.qrDataUrl && !expired ? "connecting" : "disconnected",
  };
}

async function processQueue(numberId: number) {
  const state = sessions.get(numberId);
  if (!state || state.sending || state.sendQueue.length === 0) return;
  state.sending = true;

  while (state.sendQueue.length > 0) {
    const item = state.sendQueue[0];
    let success = false;
    try {
      if (state.connected && state.socket) {
        const jid = item.to.replace(/\D/g, "") + "@s.whatsapp.net";
        await state.socket.sendMessage(jid, { text: item.message });
        success = true;
      }
    } catch {
      success = false;
    }
    state.sendQueue.shift();
    item.resolve(success);
    if (success) await new Promise(r => setTimeout(r, 800));
  }
  state.sending = false;
}

export async function startSession(numberId: number): Promise<void> {
  const existing = sessions.get(numberId);
  if (existing?.connected) return;

  if (existing?.reconnectTimer) clearTimeout(existing.reconnectTimer);
  if (existing?.socket) {
    try { existing.socket.end(undefined); } catch {}
    sessions.delete(numberId);
  }

  const sessionDir = join(SESSIONS_DIR, String(numberId));
  if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1023151900] as [number, number, number] }));

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: baileysLogger as any,
    browser: ["AchekOTP", "Chrome", "126.0.0"],
    markOnlineOnConnect: false,
    connectTimeoutMs: 45_000,
    keepAliveIntervalMs: 30_000,
    retryRequestDelayMs: 1000,
  });

  const sessionState: SessionState = {
    connected: false,
    qrDataUrl: null,
    qrTimestamp: 0,
    socket,
    sendQueue: [],
    sending: false,
  };
  sessions.set(numberId, sessionState);

  socket.ev.on("creds.update", saveCreds);

  // ── Incoming messages → bot engine ────────────────────────────────────────
  socket.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith("@g.us") || jid.endsWith("@broadcast")) continue;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";
      if (!text.trim()) continue;
      incomingMessageHandler?.(numberId, jid, text.trim());
    }
  });

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        sessionState.qrDataUrl = await toDataURL(qr, { margin: 1, scale: 6 });
        sessionState.qrTimestamp = Date.now();
        await db.update(whatsappNumbersTable)
          .set({ status: "connecting" })
          .where(eq(whatsappNumbersTable.id, numberId));
      } catch {}
    }

    if (connection === "open") {
      sessionState.connected = true;
      sessionState.qrDataUrl = null;
      await db.update(whatsappNumbersTable)
        .set({ status: "connected", sessionActive: true })
        .where(eq(whatsappNumbersTable.id, numberId));
      processQueue(numberId).catch(() => {});
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      sessionState.connected = false;
      sessionState.qrDataUrl = null;

      await db.update(whatsappNumbersTable)
        .set({ status: loggedOut ? "disconnected" : "error", sessionActive: false })
        .where(eq(whatsappNumbersTable.id, numberId));

      if (loggedOut) {
        const sessionDir = join(SESSIONS_DIR, String(numberId));
        try { rmSync(sessionDir, { recursive: true, force: true }); } catch {}
        sessions.delete(numberId);
        return;
      }

      const delay = 5_000;
      const timer = setTimeout(() => {
        startSession(numberId).catch(() => {});
      }, delay);
      sessionState.reconnectTimer = timer;
    }
  });
}

export async function sendOtpMessage(
  to: string,
  message: string,
  preferredNumberId?: number,
): Promise<{ success: boolean; numberId?: number }> {
  const tryEnqueue = (id: number, state: SessionState): Promise<boolean> => {
    if (!state.connected || !state.socket) return Promise.resolve(false);
    return new Promise(resolve => {
      state.sendQueue.push({ to, message, resolve });
      processQueue(id).catch(() => resolve(false));
    });
  };

  if (preferredNumberId) {
    const preferred = sessions.get(preferredNumberId);
    if (preferred?.connected) {
      const ok = await tryEnqueue(preferredNumberId, preferred).catch(() => false);
      if (ok) return { success: true, numberId: preferredNumberId };
    }
  }

  for (const [id, state] of sessions) {
    if (id === preferredNumberId) continue;
    if (!state.connected) continue;
    const ok = await tryEnqueue(id, state).catch(() => false);
    if (ok) return { success: true, numberId: id };
  }

  return { success: false };
}

export async function sendTextToJid(numberId: number, jid: string, text: string): Promise<boolean> {
  const state = sessions.get(numberId);
  if (!state?.connected || !state.socket) return false;
  try {
    await state.socket.sendMessage(jid, { text });
    return true;
  } catch {
    return false;
  }
}

export async function updateDisplayName(numberId: number, displayName: string): Promise<boolean> {
  const state = sessions.get(numberId);
  if (!state?.connected || !state.socket) return false;
  try {
    await state.socket.updateProfileName(displayName);
    return true;
  } catch {
    return false;
  }
}

export async function stopSession(numberId: number): Promise<void> {
  const state = sessions.get(numberId);
  if (state?.reconnectTimer) clearTimeout(state.reconnectTimer);
  if (state?.socket) {
    try { state.socket.end(undefined); } catch {}
  }
  sessions.delete(numberId);
  await db.update(whatsappNumbersTable)
    .set({ status: "disconnected", sessionActive: false })
    .where(eq(whatsappNumbersTable.id, numberId));
}

export async function restoreActiveSessions(): Promise<void> {
  try {
    const actives = await db
      .select()
      .from(whatsappNumbersTable)
      .where(eq(whatsappNumbersTable.sessionActive, true));
    for (const num of actives) {
      await startSession(num.id).catch(() => {});
    }
  } catch {}
}
