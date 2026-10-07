import "server-only";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, cardBatches, cards, qrStyles, qrStyleVersions, user } from "@/lib/db/schema";
import { getDefaultVersion, getPublishedVersion, StudioError } from "@/lib/qr-studio/service";
import { generateToken, formatSerial } from "./token";
import type { Batch } from "./types";

type BatchRow = typeof cardBatches.$inferSelect;
function toBatch(row: BatchRow, email: string | null, counts: { status: string; total: number }[], styleVersion: Batch["styleVersion"] = null): Batch {
  const stats = { unassigned: 0, active: 0, void: 0 };
  for (const c of counts) if (c.status in stats) stats[c.status as keyof typeof stats] = c.total;
  return { id: row.id, number: row.number, label: row.label, count: row.count,
    firstSerial: formatSerial(row.firstSerialNumber), lastSerial: formatSerial(row.lastSerialNumber),
    payloadFormat: row.payloadFormat, createdAt: row.createdAt.toISOString(), createdByEmail: email, stats,
    styleVersion, printStatus: row.printStatus, printStatusNote: row.printStatusNote, printStatusChangedAt: row.printStatusChangedAt?.toISOString() ?? null };
}
export async function createBatch(input: { label: string; count: number; createdBy: string; qrStyleVersionId?: string }): Promise<Batch> {
  const version = input.qrStyleVersionId ? await getPublishedVersion(input.qrStyleVersionId) : await getDefaultVersion("print");
  if (input.qrStyleVersionId && !version) throw new StudioError("Style version is not published", 409);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7238101)`);
    const [latest] = await tx.select({ number: cardBatches.number }).from(cardBatches).orderBy(desc(cardBatches.number)).limit(1);
    const [last] = await tx.select({ serial: cards.serialNumber }).from(cards).orderBy(desc(cards.serialNumber)).limit(1);
    const number = (latest?.number ?? 0) + 1, first = (last?.serial ?? 0) + 1;
    const [row] = await tx.insert(cardBatches).values({ number, label: input.label, count: input.count,
      firstSerialNumber: first, lastSerialNumber: first + input.count - 1, createdBy: input.createdBy, qrStyleVersionId: version?.id }).returning();
    for (let offset = 0; offset < input.count; offset += 1000) {
      const size = Math.min(1000, input.count - offset);
      await tx.insert(cards).values(Array.from({ length: size }, (_, i) => ({ batchId: row.id, serialNumber: first + offset + i, token: generateToken() })));
    }
    await tx.insert(auditLog).values({ actorId: input.createdBy, action: "cards.batch_created", entity: "card_batch", entityId: row.id,
      data: { number, label: input.label, count: input.count, qrStyleVersionId: version?.id } });
    const [creator] = await tx.select({ email: user.email }).from(user).where(eq(user.id, input.createdBy));
    return toBatch(row, creator?.email ?? null, [{ status: "unassigned", total: input.count }], version ? { id: version.id, styleName: "styleName" in version ? version.styleName : "NUSU Signature", version: version.version } : null);
  });
}
export async function listBatches(): Promise<Batch[]> {
  const rows = await db.select({ batch: cardBatches, email: user.email }).from(cardBatches)
    .leftJoin(user, eq(cardBatches.createdBy, user.id)).orderBy(desc(cardBatches.number));
  const counts = await db.select({ batchId: cards.batchId, status: cards.status, total: count() }).from(cards)
    .where(sql`${cards.batchId} is not null`).groupBy(cards.batchId, cards.status);
  const byId = new Map<string, { status: string; total: number }[]>();
  for (const c of counts) if (c.batchId) byId.set(c.batchId, [...(byId.get(c.batchId) ?? []), c]);
  const versions = await db.select({ id: qrStyleVersions.id, version: qrStyleVersions.version, styleName: qrStyles.name }).from(qrStyleVersions).innerJoin(qrStyles, eq(qrStyleVersions.styleId, qrStyles.id));
  const styles = new Map(versions.map(v => [v.id, v]));
  return rows.map(({ batch, email }) => toBatch(batch, email, byId.get(batch.id) ?? [], batch.qrStyleVersionId ? styles.get(batch.qrStyleVersionId) ?? null : null));
}
export async function getBatchWithCards(id: string) {
  const [batch] = await db.select().from(cardBatches).where(eq(cardBatches.id, id));
  if (!batch) return null;
  const batchCards = await db.select({ serialNumber: cards.serialNumber, token: cards.token }).from(cards)
    .where(eq(cards.batchId, id)).orderBy(cards.serialNumber);
  return { batch, cards: batchCards };
}
export async function auditBatchExport(id: string, actorId: string, options: unknown) {
  await db.insert(auditLog).values({ actorId, action: "cards.batch_exported", entity: "card_batch", entityId: id, data: { options } });
}
