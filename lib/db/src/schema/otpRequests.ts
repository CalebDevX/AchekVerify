import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const otpRequestsTable = pgTable("otp_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  requestId: text("request_id").notNull().unique(),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  status: text("status").notNull().default("pending"), // pending | sent | verified | failed | expired
  country: text("country"),
  whatsappNumberId: integer("whatsapp_number_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOtpRequestSchema = createInsertSchema(otpRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOtpRequest = z.infer<typeof insertOtpRequestSchema>;
export type OtpRequest = typeof otpRequestsTable.$inferSelect;
