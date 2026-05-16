import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { botConfigsTable } from "./botConfigs";

export const botConversationsTable = pgTable("bot_conversations", {
  id: serial("id").primaryKey(),
  botConfigId: integer("bot_config_id").notNull().references(() => botConfigsTable.id),
  sessionId: text("session_id").notNull(), // E.164 phone number of the customer
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BotConversation = typeof botConversationsTable.$inferSelect;
