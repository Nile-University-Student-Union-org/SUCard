import { bigint, boolean, check, customType, date, integer, index, jsonb, numeric, pgTable, primaryKey, text, time as pgTime, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const time = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });
export const user = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false), image: text("image"),
  role: text("role", { enum: ["super_admin", "admin", "cashier", "vendor_manager", "student"] }).notNull().default("student"),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  vendorId: uuid("vendor_id").references(() => vendors.id),
  createdAt: time("created_at"), updatedAt: time("updated_at"),
}, (t) => [check("user_admin_vendor_null_check", sql`${t.role} not in ('super_admin', 'admin', 'student') or ${t.vendorId} is null`) ]);
export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(), createdAt: time("created_at"), updatedAt: time("updated_at"),
  ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  loginMethod: text("login_method", { enum: ["password", "microsoft"] }).notNull().default("password"),
}, (t) => [index("session_user_id_idx").on(t.userId)]);
export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(), secret: text("secret").notNull(), backupCodes: text("backup_codes").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  verified: boolean("verified").notNull().default(true), failedVerificationCount: integer("failed_verification_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
}, (t) => [uniqueIndex("two_factor_user_id_idx").on(t.userId)]);
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(), key: text("key"), count: integer("count"), lastRequest: bigint("last_request", { mode: "number" }),
}, (t) => [uniqueIndex("rate_limit_key_idx").on(t.key)]);
export const authFailedAttempts = pgTable("auth_failed_attempts", {
  emailHash: text("email_hash").primaryKey(), count: integer("count").notNull(),
  lastFailedAt: timestamp("last_failed_at", { withTimezone: true }).notNull(),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"), password: text("password"), createdAt: time("created_at"), updatedAt: time("updated_at"),
}, (t) => [index("account_user_id_idx").on(t.userId), uniqueIndex("account_provider_identity_idx").on(t.providerId, t.accountId)]);
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: time("created_at"), updatedAt: time("updated_at"),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);
export const qrStyles = pgTable("qr_styles", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull().unique(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  isDefaultPrint: boolean("is_default_print").notNull().default(false), isDefaultWeb: boolean("is_default_web").notNull().default(false),
  draftConfig: jsonb("draft_config").notNull(), createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: time("created_at"), updatedAt: time("updated_at"),
}, (t) => [uniqueIndex("qr_styles_default_print_idx").on(t.isDefaultPrint).where(sql`${t.isDefaultPrint} = true`), uniqueIndex("qr_styles_default_web_idx").on(t.isDefaultWeb).where(sql`${t.isDefaultWeb} = true`)]);
export const qrStyleVersions = pgTable("qr_style_versions", {
  id: uuid("id").primaryKey().defaultRandom(), styleId: uuid("style_id").notNull().references(() => qrStyles.id),
  version: integer("version").notNull(), config: jsonb("config").notNull(), checks: jsonb("checks").notNull(),
  acceptedWarningsReason: text("accepted_warnings_reason"), publishedBy: text("published_by").references(() => user.id, { onDelete: "set null" }),
  publishedAt: time("published_at"),
}, (t) => [uniqueIndex("qr_style_versions_style_version_idx").on(t.styleId, t.version)]);
export const cardBatches = pgTable("card_batches", {
  id: uuid("id").primaryKey().defaultRandom(), number: integer("number").notNull().unique(),
  label: text("label").notNull(), count: integer("count").notNull(),
  firstSerialNumber: integer("first_serial_number").notNull(), lastSerialNumber: integer("last_serial_number").notNull(),
  payloadFormat: text("payload_format", { enum: ["code"] }).notNull().default("code"),
  qrStyleVersionId: uuid("qr_style_version_id").references(() => qrStyleVersions.id),
  printStatus: text("print_status", { enum: ["draft", "sent_to_printer", "received", "distributing"] }).notNull().default("draft"),
  printStatusNote: text("print_status_note"), printStatusChangedAt: timestamp("print_status_changed_at", { withTimezone: true }),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }), createdAt: time("created_at"),
});
export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: ["physical", "digital"] }).notNull().default("physical"),
  batchId: uuid("batch_id").references(() => cardBatches.id), serialNumber: integer("serial_number").notNull().unique(),
  token: text("token").notNull().unique(),
  status: text("status", { enum: ["unassigned", "active", "void"] }).notNull().default("unassigned"),
  studentId: text("student_id").references(() => user.id), linkedAt: timestamp("linked_at", { withTimezone: true }),
  linkedBy: text("linked_by").references(() => user.id, { onDelete: "set null" }),
  voidReason: text("void_reason"), voidedAt: timestamp("voided_at", { withTimezone: true }),
  voidedBy: text("voided_by").references(() => user.id, { onDelete: "set null" }), createdAt: time("created_at"),
}, (t) => [index("cards_batch_id_idx").on(t.batchId), uniqueIndex("cards_active_student_idx").on(t.studentId).where(sql`${t.status} = 'active'`)]);
export const studentProfiles = pgTable("student_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  universityId: text("university_id").notNull().unique(),
  cardFlow: text("card_flow", { enum: ["digital", "physical"] }).notNull(),
  status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  suspendReason: text("suspend_reason"), registeredAt: time("registered_at"),
  privacyAcceptedAt: time("privacy_accepted_at"),
}, (t) => [check("student_profiles_university_id_format", sql`${t.universityId} ~ '^[0-9]{9}$'`)]);
export const studentAdminGrants = pgTable("student_admin_grants", {
  universityId: text("university_id").primaryKey(),
  grantedBy: text("granted_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: time("created_at"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (t) => [check("student_admin_grants_university_id_format", sql`${t.universityId} ~ '^[0-9]{9}$'`)]);
export const settings = pgTable("settings", {
  key: text("key").primaryKey(), value: jsonb("value").notNull(),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }), updatedAt: time("updated_at"),
});
export const walletPasses = pgTable("wallet_passes", {
  // Keep the Google object address after account deletion so reconciliation can inactivate it.
  studentId: text("student_id").notNull(),
  platform: text("platform", { enum: ["google", "apple"] }).notNull(),
  objectId: text("object_id").notNull(),
  firstIssuedAt: time("first_issued_at"), lastSyncedAt: time("last_synced_at"),
  lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.studentId, t.platform] })]);
export const cardClaimAttempts = pgTable("card_claim_attempts", {
  id: uuid("id").primaryKey().defaultRandom(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  cardId: uuid("card_id").references(() => cards.id, { onDelete: "set null" }), result: text("result").notNull(), createdAt: time("created_at"),
}, (t) => [index("card_claim_attempts_user_created_idx").on(t.userId, t.createdAt)]);
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(), actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(), entity: text("entity").notNull(), entityId: text("entity_id").notNull(),
  data: jsonb("data").notNull(), createdAt: time("created_at"),
});
export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").primaryKey().defaultRandom(), to: text("to").notNull(), subject: text("subject").notNull(),
  html: text("html").notNull(), text: text("text").notNull(), kind: text("kind").notNull(),
  status: text("status", { enum: ["queued", "leased", "sent", "failed"] }).notNull().default("queued"),
  createdAt: time("created_at"), sentAt: timestamp("sent_at", { withTimezone: true }), attempts: integer("attempts").notNull().default(0),
  leaseId: uuid("lease_id"), leaseUntil: timestamp("lease_until", { withTimezone: true }), lastError: text("last_error"),
}, (t) => [index("email_outbox_status_created_idx").on(t.status, t.createdAt)]);

export const vendorLogos = pgTable("vendor_logos", {
  id: uuid("id").primaryKey().defaultRandom(), data: bytea("data").notNull(), mime: text("mime").notNull(), sha256: text("sha256").notNull(), createdAt: time("created_at"),
});
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), category: text("category", { enum: ["food", "coffee", "fitness", "books", "services", "other"] }).notNull(),
  contactName: text("contact_name"), contactPhone: text("contact_phone"), contactEmail: text("contact_email"), location: text("location"),
  contractStart: date("contract_start"), contractEnd: date("contract_end"), status: text("status", { enum: ["active", "paused", "ended"] }).notNull().default("active"), notes: text("notes"),
  logoId: uuid("logo_id").references(() => vendorLogos.id), createdAt: time("created_at"), updatedAt: time("updated_at"),
});
export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(), vendorId: uuid("vendor_id").notNull().references(() => vendors.id), title: text("title").notNull(), description: text("description"),
  discountType: text("discount_type", { enum: ["percent", "fixed", "free_item", "custom"] }).notNull(), discountValue: numeric("discount_value", { precision: 10, scale: 2 }), discountText: text("discount_text"), terms: text("terms"),
  startsAt: date("starts_at"), endsAt: date("ends_at"), activeDays: integer("active_days").array().notNull().default(sql`'{}'::integer[]`), activeFrom: pgTime("active_from"), activeTo: pgTime("active_to"),
  visible: boolean("visible").notNull().default(true), limitCount: integer("limit_count"), limitPeriod: text("limit_period", { enum: ["day", "week", "month", "semester", "total", "unlimited"] }).notNull().default("unlimited"),
  status: text("status", { enum: ["active", "paused"] }).notNull().default("active"), createdAt: time("created_at"), updatedAt: time("updated_at"),
});
export const offerRevisions = pgTable("offer_revisions", {
  id: uuid("id").primaryKey().defaultRandom(), offerId: uuid("offer_id").notNull().references(() => offers.id), version: integer("version").notNull(), snapshot: jsonb("snapshot").notNull(),
  changedBy: text("changed_by").references(() => user.id, { onDelete: "set null" }), changedAt: time("changed_at"),
}, (t) => [uniqueIndex("offer_revisions_offer_version_idx").on(t.offerId, t.version)]);
export const scanEvents = pgTable("scan_events", {
  id: uuid("id").primaryKey().defaultRandom(), cardId: uuid("card_id").references(() => cards.id), studentId: text("student_id").references(() => user.id),
  studentDeleted: boolean("student_deleted").notNull().default(false),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id), cashierId: text("cashier_id").notNull().references(() => user.id),
  offerId: uuid("offer_id").references(() => offers.id), result: text("result").notNull(), reason: text("reason"), confirmed: boolean("confirmed").notNull().default(false), confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  billAmount: numeric("bill_amount", { precision: 10, scale: 2 }), voided: boolean("voided").notNull().default(false), voidedAt: timestamp("voided_at", { withTimezone: true }), voidedBy: text("voided_by").references(() => user.id), voidReason: text("void_reason"),
  deviceInfo: text("device_info"), createdAt: time("created_at"),
}, (t) => [index("scan_events_limit_idx").on(t.studentId, t.offerId, t.confirmed, t.voided, t.createdAt), index("scan_events_confirmed_limit_idx").on(t.studentId, t.offerId, t.confirmedAt).where(sql`${t.confirmed} = true and ${t.voided} = false`), index("scan_events_cashier_idx").on(t.cashierId, t.createdAt), index("scan_events_vendor_idx").on(t.vendorId, t.createdAt), index("scan_events_confirmed_at_idx").on(t.confirmedAt).where(sql`${t.confirmed} = true and ${t.voided} = false`)]);
