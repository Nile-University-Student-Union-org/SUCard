import "server-only";
import { and, count, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, auditLog, cardClaimAttempts, cards, studentProfiles, user, settings } from "@/lib/db/schema";
import { buildQrPayload, formatSerial, generateToken } from "@/lib/cards/token";
import { getSettings } from "@/lib/settings/service";
import { claimDecision, computeAreas, decideFlow, matchesStudentEmail, parseClaimQr } from "./rules";
import { UNIVERSITY_ID_REGEX, type Area, type CardSummary, type ClaimErrorCode, type StudentProfile } from "./types";

export class StudentError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Card = typeof cards.$inferSelect;
function cardSummary(row: Card): CardSummary {
  return { id: row.id, type: row.type, serial: formatSerial(row.serialNumber), status: row.status,
    qr: buildQrPayload(row.token), linkedAt: row.linkedAt?.toISOString() ?? null };
}
function profileJson(row: typeof studentProfiles.$inferSelect): StudentProfile {
  return { userId: row.userId, universityId: row.universityId, cardFlow: row.cardFlow, status: row.status,
    suspendReason: row.suspendReason, registeredAt: row.registeredAt.toISOString() };
}
async function issueDigital(tx: Tx, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(7238101)`);
  const [last] = await tx.select({ serial: cards.serialNumber }).from(cards).orderBy(desc(cards.serialNumber)).limit(1);
  const [card] = await tx.insert(cards).values({ type: "digital", serialNumber: (last?.serial ?? 0) + 1,
    token: generateToken(), status: "active", studentId: userId, linkedAt: new Date() }).returning();
  return card;
}
export async function completeProfile(userId: string, universityId: string) {
  if (!UNIVERSITY_ID_REGEX.test(universityId)) throw new StudentError(400, "University ID must be exactly 9 digits");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7238103)`);
    const [person] = await tx.select().from(user).where(eq(user.id, userId)).for("update");
    if (!person || person.disabledAt) throw new StudentError(403, "Forbidden");
    const [microsoft] = await tx.select({ id: account.id }).from(account).where(and(eq(account.userId, userId), eq(account.providerId, "microsoft")));
    if (!microsoft || !matchesStudentEmail(person.email, (await getSettings(tx as unknown as typeof db)).studentEmailPattern)) throw new StudentError(403, "Microsoft student sign-in required");
    if ((await tx.select({ id: studentProfiles.userId }).from(studentProfiles).where(eq(studentProfiles.userId, userId))).length) throw new StudentError(409, "Profile already completed");
    const duplicate = await tx.select({ id: studentProfiles.userId }).from(studentProfiles).where(eq(studentProfiles.universityId, universityId));
    if (duplicate.length) {
      await tx.insert(auditLog).values({ actorId: userId, action: "students.duplicate_university_id", entity: "student", entityId: userId, data: { universityId } });
      return { duplicate: true as const };
    }
    const current = (await getSettings(tx as unknown as typeof db)).issuance;
    const decision = decideFlow(current);
    const [profile] = await tx.insert(studentProfiles).values({ userId, universityId, cardFlow: decision.flow }).returning();
    if (JSON.stringify(current) !== JSON.stringify(decision.next)) await tx.insert(settings).values({ key: "issuance", value: decision.next, updatedBy: userId })
      .onConflictDoUpdate({ target: settings.key, set: { value: decision.next, updatedBy: userId, updatedAt: new Date() } });
    if (JSON.stringify(current) !== JSON.stringify(decision.next)) await tx.insert(auditLog).values({ actorId: userId,
      action: decision.switched ? "settings.issuance_auto_switched" : "settings.physical_quota_decremented",
      entity: "settings", entityId: "issuance", data: { before: current, after: decision.next } });
    const card = decision.flow === "digital" ? await issueDigital(tx, userId) : null;
    await tx.insert(auditLog).values({ actorId: userId, action: "students.registered", entity: "student", entityId: userId,
      data: { universityId, cardFlow: decision.flow, cardId: card?.id ?? null } });
    return { duplicate: false as const, profile: profileJson(profile), card: card ? cardSummary(card) : null };
  }).then((result) => {
    if (result.duplicate) throw new StudentError(409, "This university ID is already registered. Contact SU.");
    return { profile: result.profile, card: result.card };
  });
}
export async function getStudentHome(userId: string) {
  const [row] = await db.select({ profile: studentProfiles, name: user.name, email: user.email }).from(studentProfiles)
    .innerJoin(user, eq(user.id, studentProfiles.userId)).where(eq(studentProfiles.userId, userId));
  if (!row) throw new StudentError(404, "Student profile not found");
  const [card] = await db.select().from(cards).where(and(eq(cards.studentId, userId), eq(cards.status, "active")));
  return { profile: profileJson(row.profile), name: row.name, email: row.email, card: card ? cardSummary(card) : null,
    office: (await getSettings()).office, flow: row.profile.cardFlow };
}
export async function getAreas(person: { id: string; role: string; email: string; disabledAt: Date | null }): Promise<Area[]> {
  const [profile] = await db.select({ id: studentProfiles.userId }).from(studentProfiles).where(eq(studentProfiles.userId, person.id));
  const [microsoft] = await db.select({ id: account.id }).from(account).where(and(eq(account.userId, person.id), eq(account.providerId, "microsoft")));
  const needsProfile = !profile && !!microsoft && matchesStudentEmail(person.email, (await getSettings()).studentEmailPattern);
  return computeAreas(!!profile, needsProfile, person.role, !!person.disabledAt);
}
export async function claimCard(userId: string, rawQr: string, actorId?: string, serial?: string | number) {
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7238104, hashtext(${userId}))`);
    const logAttempt = async (result: string, cardId?: string) => {
      await tx.insert(cardClaimAttempts).values({ userId, cardId, result: actorId ? `admin_${result}` : result });
    };
    const [profile] = await tx.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).for("update");
    if (!profile) throw new StudentError(403, "Student profile required");
    if (profile.status !== "active") {
      await logAttempt("suspended");
      return { error: "suspended" as const };
    }
    if (!actorId) {
      const [attempts] = await tx.select({ value: count() }).from(cardClaimAttempts).where(and(eq(cardClaimAttempts.userId, userId),
        gt(cardClaimAttempts.createdAt, new Date(Date.now() - 3600_000)), inArray(cardClaimAttempts.result,
          ["linked", "invalid_qr", "not_su_card", "already_linked", "cancelled", "already_has_card", "suspended"])));
      if (attempts.value >= 10) {
        await logAttempt("rate_limited");
        return { error: "rate_limited" as ClaimErrorCode };
      }
    }
    const token = serial === undefined ? parseClaimQr(rawQr) : null;
    if (serial === undefined && !token) {
      await logAttempt("invalid_qr");
      return { error: "invalid_qr" as ClaimErrorCode };
    }
    const serialNumber = typeof serial === "number" ? serial : serial ? Number(/^SU-(\d+)$/i.exec(serial)?.[1] ?? NaN) : null;
    const [card] = await tx.select().from(cards).where(token ? eq(cards.token, token) : eq(cards.serialNumber, serialNumber ?? -1)).for("update");
    const [active] = await tx.select().from(cards).where(and(eq(cards.studentId, userId), eq(cards.status, "active"))).for("update");
    const decision = claimDecision(card ?? null, active?.type ?? null, (await getSettings(tx as unknown as typeof db)).allowDigitalUpgrade);
    if (decision !== "link" && decision !== "upgrade") {
      await logAttempt(decision, card?.id);
      return { error: decision };
    }
    if (card.type !== "physical") {
      await logAttempt("not_su_card", card.id);
      return { error: "not_su_card" as ClaimErrorCode };
    }
    if (decision === "upgrade" && active) {
      await tx.update(cards).set({ status: "void", voidReason: "replaced_by_physical", voidedAt: new Date(), voidedBy: actorId ?? null }).where(eq(cards.id, active.id));
      await tx.insert(auditLog).values({ actorId: actorId ?? userId, action: "cards.digital_replaced", entity: "card", entityId: active.id,
        data: { replacementCardId: card.id, studentUserId: userId } });
    }
    const [linked] = await tx.update(cards).set({ status: "active", studentId: userId, linkedAt: new Date(), linkedBy: actorId ?? null }).where(eq(cards.id, card.id)).returning();
    await logAttempt("linked", card.id);
    await tx.insert(auditLog).values({ actorId: actorId ?? userId, action: actorId ? "cards.linked_by_admin" : "cards.linked", entity: "card", entityId: card.id,
      data: { studentUserId: userId, replacedCardId: decision === "upgrade" ? active?.id : null } });
    return { card: cardSummary(linked) };
  });
  if ("error" in result) {
    if (result.error === "suspended") throw new StudentError(403, "Student is suspended");
    const messages: Record<ClaimErrorCode, string> = { not_su_card: "This isn't an SU Card", already_linked: "This card is already linked to another account — return it to SU",
      cancelled: "This card was cancelled — get a new one at SU", already_has_card: "You already have an SU Card",
      rate_limited: "Too many claim attempts", invalid_qr: "Invalid QR code" };
    const code = result.error as ClaimErrorCode;
    throw new StudentError(code === "rate_limited" ? 429 : code === "invalid_qr" ? 400 : 409, messages[code], code);
  }
  return result;
}
