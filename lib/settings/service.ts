import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLog, cards, settings, studentProfiles } from "@/lib/db/schema";
import { DEFAULT_STUDENT_EMAIL_PATTERN } from "@/lib/student/rules";
import type { Settings } from "@/lib/student/types";

export const issuanceSchema = z.object({ mode: z.enum(["digital", "physical"]), physicalQuotaRemaining: z.number().int().nonnegative().nullable() });
export const officeSchema = z.object({ location: z.string().trim().min(1).max(300), hours: z.string().trim().min(1).max(300) });
export const settingsSchema = z.object({ issuance: issuanceSchema, allowDigitalUpgrade: z.boolean(), studentEmailPattern: z.string().min(1).max(500).refine((value) => {
  try { new RegExp(value); return true; } catch { return false; }
}, "Invalid regular expression"), office: officeSchema });
export const settingsPatchSchema = settingsSchema.partial().strict();
export const defaults: Settings = { issuance: { mode: "digital", physicalQuotaRemaining: null }, allowDigitalUpgrade: true,
  studentEmailPattern: DEFAULT_STUDENT_EMAIL_PATTERN, office: { location: "SU office", hours: "Contact SU for opening hours" } };
export async function getSettings(tx: typeof db = db): Promise<Settings> {
  const rows = await tx.select().from(settings);
  const result = { ...defaults };
  for (const row of rows) if (row.key in defaults) {
    const key = row.key as keyof Settings;
    const parsed = settingsSchema.shape[key].safeParse(row.value);
    if (parsed.success) Object.assign(result, { [key]: parsed.data });
  }
  return result;
}
export async function updateSettings(patch: z.infer<typeof settingsPatchSchema>, actorId: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7238103)`);
    const before = await getSettings(tx as unknown as typeof db);
    const after = settingsSchema.parse({ ...before, ...patch });
    for (const key of Object.keys(patch) as (keyof Settings)[]) {
      await tx.insert(settings).values({ key, value: after[key], updatedBy: actorId }).onConflictDoUpdate({ target: settings.key,
        set: { value: after[key], updatedBy: actorId, updatedAt: new Date() } });
    }
    if (Object.keys(patch).length) await tx.insert(auditLog).values({ actorId, action: "settings.updated", entity: "settings", entityId: "global", data: { before, after } });
    return after;
  });
}
export async function getSettingsWithStats() {
  const [current, pending, stock] = await Promise.all([
    getSettings(), db.select({ value: count() }).from(studentProfiles).where(and(eq(studentProfiles.cardFlow, "physical"),
      sql`not exists (select 1 from cards where cards.student_id = ${studentProfiles.userId} and cards.status = 'active')`)),
    db.select({ value: count() }).from(cards).where(and(eq(cards.type, "physical"), eq(cards.status, "unassigned"))),
  ]);
  const pendingPhysicalStudents = pending[0].value, unassignedCardsInStock = stock[0].value;
  return { settings: current, stats: { pendingPhysicalStudents, unassignedCardsInStock, warning: pendingPhysicalStudents > unassignedCardsInStock } };
}
