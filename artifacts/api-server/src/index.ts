import app from "./app";
import { logger } from "./lib/logger";
import { registerIncomingMessageHandler, restoreActiveSessions } from "./lib/baileys-manager";
import { handleIncomingMessage } from "./lib/bot-engine";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Register bot engine as the incoming message handler
registerIncomingMessageHandler((numberId, fromJid, text) => {
  handleIncomingMessage(numberId, fromJid, text).catch(err =>
    logger.error({ err, numberId, fromJid }, "Bot engine error"),
  );
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Restore active WhatsApp sessions after server starts
  restoreActiveSessions().catch(err =>
    logger.warn({ err }, "Failed to restore some WhatsApp sessions"),
  );
});
