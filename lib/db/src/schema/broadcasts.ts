import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const broadcastsTable = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  message: text("message").notNull(),
  recipients: text("recipients").notNull().default("[]"), // JSON array of phone numbers
  status: text("status").notNull().default("pending"), // pending | sending | done | failed
  total: integer("total").notNull().default(0),
  sent: integer("sent").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Broadcast = typeof broadcastsTable.$inferSelect;
