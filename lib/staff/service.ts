import "server-only";
import { and, asc, desc, eq, inArray, lt, max, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { account, auditLog, session, user } from "@/lib/db/schema";
import { decodeAuditCursor, encodeAuditCursor } from "./cursor";
import { wouldRemoveLastSuperAdmin } from "./rules";
import type { AuditEntry, CreateStaffRequest, ListAuditResponse, StaffMember, StaffRole, UpdateStaffRequest } from "./types";
import type { z } from "zod";
import type { auditQuerySchema } from "./validation";
import { sendAccountWelcome } from "@/lib/email/welcome";
import { randomBytes } from "node:crypto";

export class StaffError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const staffRoles = ["super_admin", "admin"] as const;
type UserRow = typeof user.$inferSelect;

function toMember(row: UserRow, selfId: string, lastLoginAt: Date | null): StaffMember {
  return {
    id: row.id, email: row.email, name: row.name, role: row.role as StaffRole,
    status: row.disabledAt ? "disabled" : "active", createdAt: row.createdAt.toISOString(),
    lastLoginAt: lastLoginAt?.toISOString() ?? null, isSelf: row.id === selfId,
  };
}

async function memberById(id: string, selfId: string): Promise<StaffMember> {
  const [row] = await db.select().from(user).where(eq(user.id, id));
  const [login] = await db.select({ last: max(session.createdAt) }).from(session).where(eq(session.userId, id));
  return toMember(row, selfId, login?.last ?? null);
}

export async function listStaff(selfId: string): Promise<StaffMember[]> {
  const rows = await db.select({ person: user, last: max(session.createdAt) })
    .from(user).leftJoin(session, eq(session.userId, user.id))
    .where(inArray(user.role, staffRoles)).groupBy(user.id).orderBy(asc(user.createdAt), asc(user.id));
  return rows.map(({ person, last }) => toMember(person, selfId, last));
}

export async function createStaff(input: CreateStaffRequest, actorId: string): Promise<StaffMember> {
  const ctx = await auth.$context;
  if (await ctx.internalAdapter.findUserByEmail(input.email)) throw new StaffError(409, "A user with this email already exists");
  // Use the password the admin typed; without one the account is reachable only via the emailed set-password link.
  const hash = await ctx.password.hash(input.password ?? randomBytes(32).toString("base64url"));
  let created;
  try {
    created = await ctx.internalAdapter.createUser({ email: input.email, name: input.name, emailVerified: true, role: input.role }, { method: "email-password" });
  } catch (error) {
    const dbError = error as { code?: string; cause?: { code?: string } };
    if (dbError.code === "23505" || dbError.cause?.code === "23505") throw new StaffError(409, "A user with this email already exists");
    throw error;
  }
  try {
    await ctx.internalAdapter.linkAccount({ userId: created.id, accountId: created.id, providerId: "credential", password: hash });
    await db.insert(auditLog).values({ actorId, action: "staff.created", entity: "staff", entityId: created.id,
      data: { email: input.email, name: input.name, role: input.role } });
  } catch (error) {
    await ctx.internalAdapter.deleteUser(created.id);
    throw error;
  }
  await sendAccountWelcome(input.email, input.name);
  return memberById(created.id, actorId);
}

export async function updateStaff(id: string, patch: UpdateStaffRequest, actorId: string): Promise<StaffMember> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7238102)`);
    const [current] = await tx.select().from(user).where(and(eq(user.id, id), inArray(user.role, staffRoles)));
    if (!current) throw new StaffError(404, "Staff member not found");
    if (id === actorId && (patch.role !== undefined || patch.status !== undefined)) throw new StaffError(400, "You cannot change your own role or status");
    const staff = await tx.select({ id: user.id, role: user.role, disabledAt: user.disabledAt }).from(user).where(inArray(user.role, staffRoles));
    if (wouldRemoveLastSuperAdmin(staff.map((person) => ({ id: person.id, role: person.role as StaffRole,
      status: person.disabledAt ? "disabled" : "active" })), id, patch)) throw new StaffError(409, "At least one active super admin is required");
    const before = { name: current.name, role: current.role, status: current.disabledAt ? "disabled" : "active" };
    const after = { name: patch.name ?? before.name, role: patch.role ?? before.role, status: patch.status ?? before.status };
    const changes: Record<string, { before: string; after: string }> = {};
    for (const key of ["name", "role", "status"] as const) {
      if (before[key] !== after[key]) changes[key] = { before: before[key], after: after[key] };
    }
    if (Object.keys(changes).length === 0) return;
    await tx.update(user).set({ name: after.name, role: after.role, disabledAt: after.status === "disabled" ? current.disabledAt ?? new Date() : null,
      updatedAt: new Date() }).where(eq(user.id, id));
    if (after.status === "disabled") await tx.delete(session).where(eq(session.userId, id));
    await tx.insert(auditLog).values({ actorId, action: "staff.updated", entity: "staff", entityId: id, data: { changes } });
  });
  return memberById(id, actorId);
}

export async function resetStaffPassword(id: string, password: string, actorId: string): Promise<void> {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  await db.transaction(async (tx) => {
    const [person] = await tx.select({ id: user.id }).from(user).where(and(eq(user.id, id), inArray(user.role, staffRoles)));
    if (!person) throw new StaffError(404, "Staff member not found");
    const [credential] = await tx.select({ id: account.id }).from(account).where(and(eq(account.userId, id), eq(account.providerId, "credential")));
    if (!credential) throw new StaffError(404, "Staff credential not found");
    await tx.update(account).set({ password: hash, updatedAt: new Date() }).where(eq(account.id, credential.id));
    await tx.delete(session).where(eq(session.userId, id));
    await tx.insert(auditLog).values({ actorId, action: "staff.password_reset", entity: "staff", entityId: id, data: {} });
  });
}

export async function listAudit(query: z.infer<typeof auditQuerySchema>): Promise<ListAuditResponse> {
  const cursor = query.cursor ? decodeAuditCursor(query.cursor) : null;
  const conditions = [
    query.action ? eq(auditLog.action, query.action) : undefined,
    query.actorId ? eq(auditLog.actorId, query.actorId) : undefined,
    cursor ? or(sql`${auditLog.createdAt} < ${cursor.createdAt}::timestamptz`,
      and(sql`${auditLog.createdAt} = ${cursor.createdAt}::timestamptz`, lt(auditLog.id, cursor.id))) : undefined,
  ].filter((condition) => condition !== undefined);
  const rows = await db.select({ audit: auditLog, actorEmail: user.email, actorName: user.name,
    exactCreatedAt: sql<string>`to_char(${auditLog.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')` })
    .from(auditLog).leftJoin(user, eq(auditLog.actorId, user.id))
    .where(and(...conditions)).orderBy(desc(auditLog.createdAt), desc(auditLog.id)).limit(query.limit + 1);
  const hasMore = rows.length > query.limit;
  const page = rows.slice(0, query.limit);
  const entries: AuditEntry[] = page.map(({ audit, actorEmail, actorName }) => ({
    id: audit.id, createdAt: audit.createdAt.toISOString(), actorId: audit.actorId,
    actorEmail, actorName, action: audit.action, entity: audit.entity, entityId: audit.entityId,
    data: audit.data as Record<string, unknown>,
  }));
  const last = page.at(-1);
  return { entries, nextCursor: hasMore && last ? encodeAuditCursor({ createdAt: last.exactCreatedAt, id: last.audit.id }) : null };
}
