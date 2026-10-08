import "server-only";
import { and, count, eq, gte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cards, offers, scanEvents, studentProfiles, user, vendors } from "@/lib/db/schema";
import { parseClaimQr } from "@/lib/student/rules";
import { getSettings } from "@/lib/settings/service";
import { confirmDecision, isOfferActiveAt, periodWindow, remainingUses, validationOutcome, vendorIsActive } from "./rules";
import type { Semester } from "./rules";
import { formatDiscount, type ScanOffer, type ValidateResponse, type ConfirmResponse, type TodayResponse } from "./types";
import { VendorError } from "./service";
type Actor = NonNullable<Awaited<ReturnType<typeof import("@/lib/auth/guards").getCashierFromRequest>>>;
type LimitContext = { studentId: string; offer: typeof offers.$inferSelect; now: Date; semesters: Semester[] };
const limits = async (tx: Pick<typeof db, "select">, { studentId, offer, now, semesters }: LimitContext) => {
  if (offer.limitPeriod === "unlimited") return {
    remainingUses: null,
    resetsAt: null
  };
  const { start, resetsAt } = periodWindow(offer.limitPeriod, now, semesters);
  const [used] = await tx.select({
    n: count()
  }).from(scanEvents).where(and(eq(scanEvents.studentId, studentId), eq(scanEvents.offerId, offer.id), eq(scanEvents.confirmed, true), eq(scanEvents.voided, false), start ? gte(scanEvents.confirmedAt, start) : undefined));
  return {
    remainingUses: remainingUses(offer.limitCount, used.n),
    resetsAt: resetsAt?.toISOString() ?? null
  };
};
async function activeOffers(tx: Pick<typeof db, "select" | "insert">, actor: Actor, studentId: string, now: Date): Promise<ScanOffer[]> {
  const rows = await tx.select().from(offers).where(eq(offers.vendorId, actor.vendor.id));
  const active = rows.filter(o => isOfferActiveAt(o, now));
  if (!active.length) return [];
  const semesters = (await getSettings(tx as typeof db)).semesters;
  const limited = active.filter(o => o.limitPeriod !== "unlimited");
  const windows = limited.map(offer => ({ offer, ...periodWindow(offer.limitPeriod, now, semesters) }));
  const usage = windows.length ? await tx.select({ offerId: scanEvents.offerId, n: count() }).from(scanEvents)
    .where(and(eq(scanEvents.studentId, studentId), eq(scanEvents.confirmed, true), eq(scanEvents.voided, false),
      or(...windows.map(({ offer, start }) => and(eq(scanEvents.offerId, offer.id), start ? gte(scanEvents.confirmedAt, start) : undefined)))))
    .groupBy(scanEvents.offerId) : [];
  const usedByOffer = new Map(usage.map(row => [row.offerId, row.n]));
  const windowsByOffer = new Map(windows.map(({ offer, resetsAt }) => [offer.id, resetsAt]));
  return active.map(offer => ({
    id: offer.id,
    title: offer.title,
    discountLabel: formatDiscount(offer),
    remainingUses: offer.limitPeriod === "unlimited" ? null : remainingUses(offer.limitCount, usedByOffer.get(offer.id) ?? 0),
    resetsAt: windowsByOffer.get(offer.id)?.toISOString() ?? null
  }));
}
export async function validateScan(actor: Actor, qr: string, userAgent: string | null, tx: Pick<typeof db, "select" | "insert"> = db): Promise<ValidateResponse> {
  const now = new Date();
  const token = parseClaimQr(qr);
  const [card] = token ? await tx.select().from(cards).where(eq(cards.token, token)) : [];
  const [student] = card?.studentId ? await tx.select({
    name: user.name,
    universityId: studentProfiles.universityId,
    status: studentProfiles.status,
    disabledAt: user.disabledAt
  }).from(studentProfiles).innerJoin(user, eq(studentProfiles.userId, user.id)).where(eq(studentProfiles.userId, card.studentId)) : [];
  const vendorActive = vendorIsActive(actor.vendor, now);
  const canOffer = !!card && card.status === "active" && !!student && student.status === "active" && !student.disabledAt && vendorActive;
  const applicable = canOffer ? await activeOffers(tx, actor, card.studentId!, now) : [];
  const result = validationOutcome({
    qrValid: !!token,
    cardStatus: !card ? "missing" : card.status,
    studentActive: !!student && student.status === "active" && !student.disabledAt,
    vendorActive,
    activeOfferCount: applicable.length,
    availableOfferCount: applicable.filter(o => o.remainingUses === null || o.remainingUses > 0).length
  });
  const [scan] = await tx.insert(scanEvents).values({
    cardId: card?.id ?? null,
    studentId: card?.studentId ?? null,
    vendorId: actor.vendor.id,
    cashierId: actor.person.id,
    result,
    reason: result === "valid" ? null : result,
    deviceInfo: userAgent?.slice(0, 300) ?? null
  }).returning({
    id: scanEvents.id
  });
  const resets = applicable.map(o => o.resetsAt).filter((x): x is string => !!x).sort();
  return {
    scanId: scan.id,
    result,
    reason: result === "valid" ? null : result,
    student: canOffer ? {
      name: student.name,
      universityId: student.universityId
    } : null,
    offers: applicable,
    resetsAt: result === "limit_reached" ? resets[0] ?? null : null
  };
}
export async function confirmScan(actor: Actor, scanId: string, offerId: string, billAmount?: number): Promise<{
  response: ConfirmResponse;
  notification: { redemptionId: string; userId: string; vendorName: string; discountLabel: string; offerTitle: string; at: Date } | null;
}> {
  return db.transaction(async tx => {
    const [scan] = await tx.select().from(scanEvents).where(eq(scanEvents.id, scanId)).for("update");
    if (!scan) throw new VendorError(404, "Scan not found");
    if (scan.vendorId !== actor.vendor.id) throw new VendorError(403, "Forbidden");
    const decision = confirmDecision(scan, actor.person.id, new Date());
    if (decision === "forbidden") throw new VendorError(403, "Forbidden");
    if (decision === "existing") {
      if (scan.offerId !== offerId || scan.voided) throw new VendorError(409, "Scan already confirmed for another offer or voided");
      return { response: {
        scanId,
        offerId,
        confirmedAt: scan.confirmedAt!.toISOString(),
        billAmount: scan.billAmount,
        remainingUses: null,
        resetsAt: null
      }, notification: null };
    }
    if (decision !== "confirm") throw new VendorError(409, decision === "expired" ? "Scan expired" : "Scan was not valid");
    if (!scan.studentId || !scan.cardId) throw new VendorError(403, "Forbidden");
    // Serializes limit decisions for this student and offer across every cashier.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${scan.studentId}), hashtext(${offerId}))`);
    const [card] = await tx.select().from(cards).where(eq(cards.id, scan.cardId));
    const [profile] = await tx.select({ status: studentProfiles.status, disabledAt: user.disabledAt }).from(studentProfiles).innerJoin(user, eq(studentProfiles.userId, user.id)).where(eq(studentProfiles.userId, scan.studentId));
    const [cashier] = await tx.select().from(user).where(eq(user.id, actor.person.id));
    const [offer] = await tx.select().from(offers).where(and(eq(offers.id, offerId), eq(offers.vendorId, actor.vendor.id)));
    const [vendor] = await tx.select().from(vendors).where(eq(vendors.id, actor.vendor.id));
    const now = new Date();
    if (!cashier || cashier.disabledAt || cashier.role !== "cashier" || cashier.vendorId !== scan.vendorId) throw new VendorError(403, "Cashier is no longer authorized");
    if (!card || card.status !== "active" || card.studentId !== scan.studentId || !profile || profile.status !== "active" || profile.disabledAt || !vendor || !vendorIsActive(vendor, now) || !offer || !isOfferActiveAt(offer, now)) throw new VendorError(409, "Card, vendor, or offer is no longer active");
    const allowance = await limits(tx, { studentId: scan.studentId, offer, now, semesters: (await getSettings()).semesters });
    if (allowance.remainingUses === 0) throw new VendorError(409, "Offer limit reached", "limit_reached");
    const [confirmed] = await tx.update(scanEvents).set({
      confirmed: true,
      confirmedAt: now,
      offerId,
      billAmount: billAmount === undefined ? null : billAmount.toFixed(2)
    }).where(eq(scanEvents.id, scanId)).returning();
    return { response: {
      scanId,
      offerId,
      confirmedAt: confirmed.confirmedAt!.toISOString(),
      billAmount: confirmed.billAmount,
      remainingUses: allowance.remainingUses === null ? null : allowance.remainingUses - 1,
      resetsAt: allowance.resetsAt
    }, notification: {
      redemptionId: confirmed.id,
      userId: scan.studentId,
      vendorName: vendor.name,
      discountLabel: formatDiscount(offer),
      offerTitle: offer.title,
      at: confirmed.confirmedAt!
    } };
  });
}
export async function today(actor: Actor): Promise<TodayResponse> {
  const start = periodWindow("day", new Date()).start!;
  const rows = await db.select({
    scan: scanEvents,
    studentName: user.name,
    universityId: studentProfiles.universityId,
    offerTitle: offers.title
  }).from(scanEvents).innerJoin(user, eq(scanEvents.studentId, user.id)).innerJoin(studentProfiles, eq(scanEvents.studentId, studentProfiles.userId)).innerJoin(offers, eq(scanEvents.offerId, offers.id)).where(and(eq(scanEvents.vendorId, actor.vendor.id), eq(scanEvents.confirmed, true), eq(scanEvents.voided, false), gte(scanEvents.confirmedAt, start))).orderBy(scanEvents.confirmedAt);
  const redemptions = rows.map(({
    scan,
    studentName,
    universityId,
    offerTitle
  }) => ({
    id: scan.id,
    studentName,
    universityId,
    offerTitle,
    billAmount: scan.billAmount,
    confirmedAt: scan.confirmedAt!.toISOString()
  }));
  const total = redemptions.reduce((n, r) => n + Number(r.billAmount ?? 0), 0);
  return {
    count: rows.length,
    totalBill: total.toFixed(2),
    redemptions
  };
}

