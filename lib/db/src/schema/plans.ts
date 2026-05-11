import { pgTable, text, serial, timestamp, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  period: text("period").notNull(), // monthly | yearly
  price: real("price").notNull(),
  currency: text("currency").notNull().default("NGN"),
  otpLimit: integer("otp_limit").notNull(),
  features: text("features").array().notNull().default([]),
  popular: boolean("popular").notNull().default(false),
  active: boolean("active").notNull().default(true),
  allowCustomNumber: boolean("allow_custom_number").notNull().default(false),
  allowUsaNumbers: boolean("allow_usa_numbers").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
