import "server-only";
import { and, asc, eq, gt, ilike, inArray, or, sql } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/lib/db";
import { auditLog, cardBatches, cards, studentProfiles, user } from "@/lib/db/schema";
import { formatSerial, parseSerial } from "@/lib/cards/token";
import { claimCard, getStudentHome, StudentError, voidDigitalCardsForPhysicalFlow } from "./service";
import { parseClaimQr } from "./rules";
import type { AdminLinkRequest, CardFlow } from "./types";
import { syncGoogleWalletForStudent } from "@/lib/wallet/google";
import { enqueueCardVoided } from "@/lib/email/card-voided";
import { drainOutbox } from "@/lib/email/drain";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
async function issueDigital(tx: Tx, userId: string) {
  const { generateToken } = await import("@/lib/cards/token");
  await tx.execute(sql`select pg_advisory_xact_lock(7238101)`);
  const [last] = await tx.select({ serial: cards.serialNumber }).from(cards).orderBy(sql`${cards.serialNumber} desc`).limit(1);
  await tx.insert(cards).values({ type: "digital", serialNumber: (last?.serial ?? 0) + 1, token: generateToken(),
    status: "active", studentId: userId, linkedAt: new Date() });
}
export async function voidCard(cardId: string, reason: string, actorId: string) {
  const result = await db.transaction(async (tx) => {
    const [card] = await tx.select().from(cards).where(eq(cards.id, cardId)).for("update");
    if (!card) throw new StudentError(404, "Card not found");
    if (card.status === "void") throw new StudentError(409, "Card already voided");
    await tx.update(cards).set({ status: "void", voidReason: reason, voidedAt: new Date(), voidedBy: actorId }).where(eq(cards.id, cardId));
    await tx.insert(auditLog).values({ actorId, action: "cards.voided", entity: "card", entityId: cardId,
      data: { reason, before: card.status, studentId: card.studentId } });
    const notified = card.status === "active" && card.studentId
      ? await enqueueCardVoided(tx, card.studentId, card.type, reason) : false;
    return { count: 1, syncStudentId: card.status === "active" ? card.studentId : null, notified };
  });
  if (result.notified) after(async () => { await drainOutbox(20); });
  if (result.syncStudentId) await syncGoogleWalletForStudent(result.syncStudentId);
  return { count: result.count };
}
export async function voidBatch(batchId: string, reason: string, actorId: string) {
  const result = await db.transaction(async (tx) => {
    const [batch] = await tx.select({ id: cardBatches.id }).from(cardBatches).where(eq(cardBatches.id, batchId));
    if (!batch) throw new StudentError(404, "Batch not found");
    const affected = await tx.select({ id: cards.id, studentId: cards.studentId, type: cards.type, status: cards.status })
      .from(cards).where(and(eq(cards.batchId, batchId), inArray(cards.status, ["unassigned", "active"]))).for("update");
    if (affected.length) await tx.update(cards).set({ status: "void", voidReason: reason, voidedAt: new Date(), voidedBy: actorId })
      .where(inArray(cards.id, affected.map((card) => card.id)));
    const students = new Map<string, "digital" | "physical">();
    for (const card of affected) if (card.status === "active" && card.studentId) students.set(card.studentId, card.type);
    for (const [studentId, type] of students) await enqueueCardVoided(tx, studentId, type, reason);
    await tx.insert(auditLog).values({ actorId, action: "cards.batch_voided", entity: "card_batch", entityId: batchId,
      data: { reason, count: affected.length } });
    return { count: affected.length, studentIds: [...students.keys()] };
  });
  if (result.studentIds.length) after(async () => { await drainOutbox(20); });
  await Promise.all(result.studentIds.map((id) => syncGoogleWalletForStudent(id)));
  return { count: result.count };
}
export async function lookupCard(input: AdminLinkRequest) {
  const token = "qr" in input && input.qr ? parseClaimQr(input.qr) : null;
  const serial = "serial" in input ? parseSerial(input.serial) : null;
  if ("qr" in input && !token) throw new StudentError(400, "Invalid QR code", "invalid_qr");
  if ("serial" in input && serial === null) throw new StudentError(400, "Invalid serial");
  const [row] = await db.select({ card: cards, batchLabel: cardBatches.label, name: user.name, email: user.email,
    universityId: studentProfiles.universityId }).from(cards).leftJoin(cardBatches, eq(cards.batchId, cardBatches.id))
    .leftJoin(user, eq(cards.studentId, user.id)).leftJoin(studentProfiles, eq(cards.studentId, studentProfiles.userId))
    .where(token ? eq(cards.token, token) : eq(cards.serialNumber, serial ?? -1));
  if (!row) throw new StudentError(404, "Card not found");
  const card = row.card;
  return { card: { id: card.id, type: card.type, serial: formatSerial(card.serialNumber), status: card.status,
    qr: `NUSU1:${card.token}`, linkedAt: card.linkedAt?.toISOString() ?? null, batchLabel: row.batchLabel,
    student: card.studentId && row.name && row.email && row.universityId ? { userId: card.studentId, name: row.name,
      email: row.email, universityId: row.universityId } : null } };
}
export async function adminLinkCard(studentUserId: string, input: AdminLinkRequest, actorId: string) {
  return claimCard(studentUserId, "qr" in input ? input.qr ?? "" : "", actorId, "serial" in input ? input.serial : undefined);
}
export async function searchStudents(q: string, cursor?: string, filters: {status?: "active"|"suspended";signedUpFrom?:string;signedUpTo?:string} = {}) {
  let after: { name: string; id: string } | null = null;
  if (cursor) {
    try {
      const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
      if (typeof value.name !== "string" || typeof value.id !== "string") throw new Error();
      after = value;
    } catch { throw new StudentError(400, "Invalid cursor"); }
  }
  const needle = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const serial = parseSerial(q);
  const rows = await db.select({ profile: studentProfiles, name: user.name, email: user.email, card: cards,
    lastRedemptionAt: sql<Date | null>`(select max(se.confirmed_at) from scan_events se where se.student_id = ${studentProfiles.userId} and se.confirmed and not se.voided)` }).from(studentProfiles)
    .innerJoin(user, eq(studentProfiles.userId, user.id))
    .leftJoin(cards, and(eq(cards.studentId, studentProfiles.userId), eq(cards.status, "active"))).where(and(
      q ? or(ilike(user.name, needle), ilike(user.email, needle), ilike(studentProfiles.universityId, needle),
        serial !== null ? eq(cards.serialNumber, serial) : undefined) : undefined,
      filters.status ? eq(studentProfiles.status,filters.status) : undefined,
      filters.signedUpFrom ? sql`${studentProfiles.registeredAt} >= (${filters.signedUpFrom}::date::timestamp at time zone 'Africa/Cairo')` : undefined,
      filters.signedUpTo ? sql`${studentProfiles.registeredAt} < ((${filters.signedUpTo}::date + 1)::timestamp at time zone 'Africa/Cairo')` : undefined,
      after ? or(gt(user.name, after.name), and(eq(user.name, after.name), gt(user.id, after.id))) : undefined))
    .orderBy(asc(user.name), asc(user.id)).limit(26);
  const page = rows.slice(0, 25);
  const students = page.map((row) => ({
    profile: { userId: row.profile.userId, universityId: row.profile.universityId, cardFlow: row.profile.cardFlow,
      status: row.profile.status, suspendReason: row.profile.suspendReason, registeredAt: row.profile.registeredAt.toISOString() },
    name: row.name, email: row.email,
    card: row.card ? { id: row.card.id, type: row.card.type, serial: formatSerial(row.card.serialNumber),
      status: row.card.status, qr: `NUSU1:${row.card.token}`, linkedAt: row.card.linkedAt?.toISOString() ?? null } : null,
    registeredAt: row.profile.registeredAt.toISOString(),
    lastRedemptionAt: row.lastRedemptionAt ? new Date(row.lastRedemptionAt).toISOString() : null,
  }));
  const last = page.at(-1);
  return { students, nextCursor: rows.length > 25 && last ? Buffer.from(JSON.stringify({ name: last.name, id: last.profile.userId })).toString("base64url") : null };
}
export async function setStudentFlow(userId: string, flow: CardFlow, actorId: string) {
  const notified = await db.transaction(async (tx) => {
    const [profile] = await tx.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).for("update");
    if (!profile) throw new StudentError(404, "Student not found");
    if (profile.cardFlow === flow) return false;
    const voided = flow === "physical" ? await voidDigitalCardsForPhysicalFlow(tx, userId, actorId) : false;
    if (flow === "digital" && (await tx.select({ id: cards.id }).from(cards).where(and(eq(cards.studentId, userId), eq(cards.status, "active"))).for("update")).length)
      throw new StudentError(409, "Student already has an active card");
    await tx.update(studentProfiles).set({ cardFlow: flow }).where(eq(studentProfiles.userId, userId));
    if (flow === "digital") await issueDigital(tx, userId);
    await tx.insert(auditLog).values({ actorId, action: "students.flow_changed", entity: "student", entityId: userId,
      data: { before: profile.cardFlow, after: flow } });
    return voided;
  });
  if (notified) after(async () => { await drainOutbox(20); });
  const home = await getStudentHome(userId);
  await syncGoogleWalletForStudent(userId);
  return { student: { profile: home.profile, name: home.name, email: home.email, card: home.card } };
}
export async function switchAllPendingToDigital(actorId: string) {
  return db.transaction(async (tx) => {
    const pending = await tx.select({ userId: studentProfiles.userId }).from(studentProfiles)
      .where(and(eq(studentProfiles.cardFlow, "physical"), sql`not exists (select 1 from cards where cards.student_id = ${studentProfiles.userId} and cards.status = 'active')`)).for("update");
    for (const row of pending) {
      await tx.update(studentProfiles).set({ cardFlow: "digital" }).where(eq(studentProfiles.userId, row.userId));
      await issueDigital(tx, row.userId);
    }
    await tx.insert(auditLog).values({ actorId, action: "students.pending_switched_to_digital", entity: "students", entityId: "bulk",
      data: { count: pending.length } });
    return { count: pending.length };
  });
}
