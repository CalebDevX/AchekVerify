import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const botConfigsTable = pgTable("bot_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  enabled: boolean("enabled").notNull().default(false),
  provider: text("provider").notNull().default("openai"),
  apiKey: text("api_key"),
  model: text("model").default("gpt-4o-mini"),
  botName: text("bot_name").default("AchekBot"),
  systemPrompt: text("system_prompt"),
  welcomeMessage: text("welcome_message"),
  fallbackMessage: text("fallback_message"),
  features: text("features").default("[]"),
  maxTokens: integer("max_tokens").default(500),
  totalMessages: integer("total_messages").notNull().default(0),
  // New enhanced fields
  webhookUrl: text("webhook_url"),
  language: text("language").notNull().default("en"),
  businessHoursEnabled: boolean("business_hours_enabled").notNull().default(false),
  businessHoursStart: text("business_hours_start").notNull().default("09:00"),
  businessHoursEnd: text("business_hours_end").notNull().default("17:00"),
  businessHoursTimezone: text("business_hours_timezone").notNull().default("Africa/Lagos"),
  outsideHoursMessage: text("outside_hours_message"),
  handoffKeyword: text("handoff_keyword"),
  handoffMessage: text("handoff_message"),
  responseDelayMs: integer("response_delay_ms").notNull().default(1500),
  typingIndicatorEnabled: boolean("typing_indicator_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type BotConfig = typeof botConfigsTable.$inferSelect;
