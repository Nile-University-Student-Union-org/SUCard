import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, qrStyles, qrStyleVersions } from "@/lib/db/schema";
import { checkStyle } from "@/lib/qr-style/checks";
import { NUSU_SIGNATURE_CONFIG, QR_PRESETS, qrStyleConfigSchema, type QrStyleConfig } from "@/lib/qr-style/config";
import type { QrStyleDto, QrStyleVersionDto } from "./types";

export class StudioError extends Error { constructor(message: string, public status = 400) { super(message); } }
type StyleRow = typeof qrStyles.$inferSelect;
type VersionRow = typeof qrStyleVersions.$inferSelect;
const versionDto = (v: VersionRow): QrStyleVersionDto => ({ id: v.id, styleId: v.styleId, version: v.version, config: qrStyleConfigSchema.parse(v.config), checks: v.checks as QrStyleVersionDto["checks"], acceptedWarningsReason: v.acceptedWarningsReason, publishedAt: v.publishedAt.toISOString() });
async function styleDto(s: StyleRow): Promise<QrStyleDto> {
  const [v] = await db.select().from(qrStyleVersions).where(eq(qrStyleVersions.styleId, s.id)).orderBy(desc(qrStyleVersions.version)).limit(1);
  return { id: s.id, name: s.name, status: s.status, isDefaultPrint: s.isDefaultPrint, isDefaultWeb: s.isDefaultWeb, draftConfig: qrStyleConfigSchema.parse(s.draftConfig), createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(), latestVersion: v ? versionDto(v) : null };
}
export async function listStyles() { return Promise.all((await db.select().from(qrStyles).orderBy(qrStyles.name)).map(styleDto)); }
export async function getStyle(id: string) { const [s] = await db.select().from(qrStyles).where(eq(qrStyles.id, id)); return s ? styleDto(s) : null; }
export async function getVersion(id: string) { const [v] = await db.select().from(qrStyleVersions).where(eq(qrStyleVersions.id, id)); return v ? versionDto(v) : null; }
export async function createStyle(input: { name: string; preset?: keyof typeof QR_PRESETS; duplicateVersionId?: string; config?: QrStyleConfig }, actorId: string) {
  const duplicate = input.duplicateVersionId ? await getVersion(input.duplicateVersionId) : null;
  if (input.duplicateVersionId && !duplicate) throw new StudioError("Version not found", 404);
  const config = input.config ?? duplicate?.config ?? (input.preset ? QR_PRESETS[input.preset] : QR_PRESETS.Classic);
  try {
    const [row] = await db.insert(qrStyles).values({ name: input.name, draftConfig: config, createdBy: actorId }).returning();
    await db.insert(auditLog).values({ actorId, action: "qr_style.created", entity: "qr_style", entityId: row.id, data: { name: input.name, preset: input.preset, duplicateVersionId: input.duplicateVersionId } });
    return styleDto(row);
  } catch (error) { if (String(error).includes("unique")) throw new StudioError("Style name already exists", 409); throw error; }
}
export async function updateStyle(id: string, input: { name?: string; draftConfig?: QrStyleConfig }, actorId: string) {
  const old = await getStyle(id); if (!old) throw new StudioError("Style not found", 404);
  if (old.status === "archived") throw new StudioError("Archived styles cannot be edited", 409);
  try {
    const [row] = await db.update(qrStyles).set({ ...(input.name === undefined ? {} : { name: input.name }), ...(input.draftConfig === undefined ? {} : { draftConfig: input.draftConfig }), updatedAt: new Date() }).where(eq(qrStyles.id, id)).returning();
    await db.insert(auditLog).values({ actorId, action: "qr_style.saved", entity: "qr_style", entityId: id, data: { before: { name: old.name, draftConfig: old.draftConfig }, after: input } });
    return styleDto(row);
  } catch (error) { if (String(error).includes("unique")) throw new StudioError("Style name already exists", 409); throw error; }
}
export async function publishStyle(id: string, reason: string | undefined, actorId: string) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`);
    const [style] = await tx.select().from(qrStyles).where(eq(qrStyles.id, id));
    if (!style) throw new StudioError("Style not found", 404);
    if (style.status === "archived") throw new StudioError("Archived styles cannot be published", 409);
    const config = qrStyleConfigSchema.parse(style.draftConfig);
    const checks = checkStyle(config);
    if (checks.overall === "block") throw new StudioError("Blocking scan-safety checks", 409);
    if (checks.overall === "warn" && (!reason || reason.trim().length < 5)) throw new StudioError("Warnings require a reason of at least 5 characters", 409);
    const [previous] = await tx.select({ version: qrStyleVersions.version }).from(qrStyleVersions).where(eq(qrStyleVersions.styleId, id)).orderBy(desc(qrStyleVersions.version)).limit(1);
    const [version] = await tx.insert(qrStyleVersions).values({ styleId: id, version: (previous?.version ?? 0) + 1, config, checks, acceptedWarningsReason: checks.overall === "warn" ? reason!.trim() : null, publishedBy: actorId }).returning();
    await tx.update(qrStyles).set({ status: "published", updatedAt: new Date() }).where(eq(qrStyles.id, id));
    await tx.insert(auditLog).values({ actorId, action: "qr_style.published", entity: "qr_style", entityId: id, data: { version: version.version, checks, acceptedWarningsReason: version.acceptedWarningsReason } });
    return versionDto(version);
  });
}
export async function setArchived(id: string, archive: boolean, actorId: string) {
  return db.transaction(async tx => {
    const [s] = await tx.select().from(qrStyles).where(eq(qrStyles.id, id));
    if (!s) throw new StudioError("Style not found", 404);
    if (archive && (s.isDefaultPrint || s.isDefaultWeb)) throw new StudioError("A default style cannot be archived", 409);
    const [existingVersion] = await tx.select({ id: qrStyleVersions.id }).from(qrStyleVersions).where(eq(qrStyleVersions.styleId, id)).limit(1);
    const [row] = await tx.update(qrStyles).set({ status: archive ? "archived" : existingVersion ? "published" : "draft", updatedAt: new Date() }).where(eq(qrStyles.id, id)).returning();
    await tx.insert(auditLog).values({ actorId, action: archive ? "qr_style.archived" : "qr_style.unarchived", entity: "qr_style", entityId: id, data: { before: s.status, after: row.status } });
    return row;
  });
}
export async function setDefault(id: string, target: "print" | "web", actorId: string) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(727895)`);
    const [s] = await tx.select().from(qrStyles).where(eq(qrStyles.id, id));
    if (!s) throw new StudioError("Style not found", 404);
    if (s.status !== "published") throw new StudioError("Only published styles can be defaults", 409);
    const [v] = await tx.select().from(qrStyleVersions).where(eq(qrStyleVersions.styleId, id)).limit(1);
    if (!v) throw new StudioError("Published version not found", 409);
    const column = target === "print" ? qrStyles.isDefaultPrint : qrStyles.isDefaultWeb;
    await tx.update(qrStyles).set(target === "print" ? { isDefaultPrint: false } : { isDefaultWeb: false }).where(eq(column, true));
    await tx.update(qrStyles).set({ [target === "print" ? "isDefaultPrint" : "isDefaultWeb"]: true, updatedAt: new Date() }).where(eq(qrStyles.id, id));
    await tx.insert(auditLog).values({ actorId, action: "qr_style.default_changed", entity: "qr_style", entityId: id, data: { target } });
  });
}
export async function getDefaultVersion(target: "print" | "web") {
  const [s] = await db.select().from(qrStyles).where(and(eq(target === "print" ? qrStyles.isDefaultPrint : qrStyles.isDefaultWeb, true), eq(qrStyles.status, "published")));
  if (!s) return null;
  const [v] = await db.select().from(qrStyleVersions).where(eq(qrStyleVersions.styleId, s.id)).orderBy(desc(qrStyleVersions.version)).limit(1);
  return v ? { ...versionDto(v), styleName: s.name } : null;
}
export async function getWebQrConfig(): Promise<QrStyleConfig> { return (await getDefaultVersion("web"))?.config ?? NUSU_SIGNATURE_CONFIG; }
export async function getPublishedVersion(id: string) {
  const [row] = await db.select({ version: qrStyleVersions, style: qrStyles }).from(qrStyleVersions).innerJoin(qrStyles, eq(qrStyleVersions.styleId, qrStyles.id)).where(eq(qrStyleVersions.id, id));
  return row?.style.status === "published" ? { ...versionDto(row.version), styleName: row.style.name } : null;
}
