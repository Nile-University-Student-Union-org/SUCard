import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLog, cards, settings, studentProfiles } from "@/lib/db/schema";
import { DEFAULT_STUDENT_EMAIL_PATTERN, isSafeStudentEmailPattern } from "@/lib/student/rules";
import type { Settings } from "@/lib/student/types";
import { cairoDate } from "@/lib/settings/office-hours";

export const issuanceSchema = z.object({ mode: z.enum(["digital", "physical"]), physicalQuotaRemaining: z.number().int().nonnegative().nullable() });
const clockSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM in 24-hour time");
const weeklyDaySchema = z.strictObject({ day: z.number().int().min(0).max(6), open: clockSchema, close: clockSchema })
  .refine((hours) => hours.open < hours.close, "Opening time must be before closing time");
const exceptionSchema = z.strictObject({ date: z.iso.date(), closed: z.boolean(), open: clockSchema.optional(), close: clockSchema.optional(), note: z.string().trim().max(120).optional() })
  .superRefine((exception, context) => {
    if (!exception.closed && (!exception.open || !exception.close)) context.addIssue({ code: "custom", message: "Open and close are required for an open exception" });
    if (exception.open && exception.close && exception.open >= exception.close) context.addIssue({ code: "custom", message: "Opening time must be before closing time" });
  });
export const officeScheduleSchema = z.strictObject({
  weekly: z.array(weeklyDaySchema).max(7).refine((days) => new Set(days.map((day) => day.day)).size === days.length, "Each weekday may appear once"),
  exceptions: z.array(exceptionSchema).max(60).refine((exceptions) => new Set(exceptions.map((exception) => exception.date)).size === exceptions.length, "Each date may appear once"),
});
export const officeSchema = z.strictObject({ location: z.string().trim().min(1).max(300), schedule: officeScheduleSchema });
export const settingsSchema = z.object({ issuance: issuanceSchema, allowDigitalUpgrade: z.boolean(), emailOnSuspend: z.boolean(), atRisk: z.strictObject({ redemptions: z.number().int().min(1).max(100000), days: z.number().int().min(1).max(365) }), semesters: z.array(z.strictObject({ name: z.string().trim().min(1).max(80), start: z.iso.date(), end: z.iso.date() }).refine((s) => s.end >= s.start)).max(20), studentEmailPattern: z.string().min(1).max(160).refine(isSafeStudentEmailPattern, "Use a bounded email pattern"), office: officeSchema });
export const settingsPatchSchema = settingsSchema.partial().strict();
export const defaults: Settings = { issuance: { mode: "digital", physicalQuotaRemaining: null }, allowDigitalUpgrade: true, emailOnSuspend: false, atRisk: { redemptions: 10, days: 30 },
  studentEmailPattern: DEFAULT_STUDENT_EMAIL_PATTERN, office: { location: "SU office", schedule: { weekly: [0, 1, 2, 3, 4].map((day) => ({ day, open: "09:00", close: "17:00" })), exceptions: [] } }, semesters: [] };
export async function getSettings(tx: typeof db = db): Promise<Settings> {
  const rows = await tx.select().from(settings);
  const result = { ...defaults };
  for (const row of rows) if (row.key in defaults) {
    const key = row.key as keyof Settings;
    const storedValue = key === "office" && z.strictObject({ location: z.string(), hours: z.string() }).safeParse(row.value).success
      ? { location: (row.value as { location: string }).location, schedule: defaults.office.schedule }
      : row.value;
    const parsed = settingsSchema.shape[key].safeParse(storedValue);
    if (parsed.success) Object.assign(result, { [key]: parsed.data });
  }
  return result;
}
export async function updateSettings(patch: z.infer<typeof settingsPatchSchema>, actorId: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7238103)`);
    const before = await getSettings(tx as unknown as typeof db);
    const after = settingsSchema.parse({ ...before, ...patch });
    if (patch.office) after.office.schedule.exceptions = after.office.schedule.exceptions.filter((exception) => exception.date >= cairoDate(new Date()));
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
