import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const botConfigsTable = pgTable("bot_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  enabled: boolean("enabled").notNull().default(false),
  provider: text("provider").notNull().default("openai"), // openai | gemini
  apiKey: text("api_key"),
  model: text("model").default("gpt-4o-mini"),
  botName: text("bot_name").default("AchekBot"),
  systemPrompt: text("system_prompt"),
  welcomeMessage: text("welcome_message"),
  fallbackMessage: text("fallback_message"),
  features: text("features").default("[]"), // JSON array: ["otp_help","faq","lead_capture","order_tracking"]
  maxTokens: integer("max_tokens").default(500),
  totalMessages: integer("total_messages").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type BotConfig = typeof botConfigsTable.$inferSelect;
