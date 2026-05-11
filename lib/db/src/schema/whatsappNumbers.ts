import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whatsappNumbersTable = pgTable("whatsapp_numbers", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  country: text("country").notNull(), // us | ng | uk
  label: text("label"),
  status: text("status").notNull().default("disconnected"), // disconnected | connecting | connected | error
  sessionActive: boolean("session_active").notNull().default(false),
  sessionData: text("session_data"),
  otpSentCount: integer("otp_sent_count").notNull().default(0),
  ownerId: integer("owner_id"), // null = admin pool; set = user-owned custom number
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWhatsappNumberSchema = createInsertSchema(whatsappNumbersTable).omit({
  id: true, createdAt: true, updatedAt: true, sessionActive: true, sessionData: true, otpSentCount: true, status: true,
});
export type InsertWhatsappNumber = z.infer<typeof insertWhatsappNumberSchema>;
export type WhatsappNumber = typeof whatsappNumbersTable.$inferSelect;
