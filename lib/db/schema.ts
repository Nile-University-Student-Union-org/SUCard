import { boolean, integer, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const time = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();
export const user = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false), image: text("image"),
  role: text("role", { enum: ["super_admin", "admin", "cashier", "vendor_manager", "student"] }).notNull().default("student"),
  createdAt: time("created_at"), updatedAt: time("updated_at"),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(), createdAt: time("created_at"), updatedAt: time("updated_at"),
  ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("session_user_id_idx").on(t.userId)]);
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"), password: text("password"), createdAt: time("created_at"), updatedAt: time("updated_at"),
}, (t) => [index("account_user_id_idx").on(t.userId)]);
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: time("created_at"), updatedAt: time("updated_at"),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);
export const cardBatches = pgTable("card_batches", {
  id: uuid("id").primaryKey().defaultRandom(), number: integer("number").notNull().unique(),
  label: text("label").notNull(), count: integer("count").notNull(),
  firstSerialNumber: integer("first_serial_number").notNull(), lastSerialNumber: integer("last_serial_number").notNull(),
  payloadFormat: text("payload_format", { enum: ["code"] }).notNull().default("code"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }), createdAt: time("created_at"),
});
export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: ["physical", "digital"] }).notNull().default("physical"),
  batchId: uuid("batch_id").references(() => cardBatches.id), serialNumber: integer("serial_number").notNull().unique(),
  token: text("token").notNull().unique(),
  status: text("status", { enum: ["unassigned", "active", "void"] }).notNull().default("unassigned"),
  studentId: text("student_id").references(() => user.id), linkedAt: timestamp("linked_at", { withTimezone: true }),
  voidReason: text("void_reason"), createdAt: time("created_at"),
}, (t) => [index("cards_batch_id_idx").on(t.batchId), uniqueIndex("cards_active_student_idx").on(t.studentId).where(sql`${t.status} = 'active'`)]);
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(), actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(), entity: text("entity").notNull(), entityId: text("entity_id").notNull(),
  data: jsonb("data").notNull(), createdAt: time("created_at"),
});
