import { z } from "zod";
import { cairoParts } from "@/lib/vendors/rules";

const day = z.iso.date();
export const rangeSchema = z.strictObject({ from: day.optional(), to: day.optional() });
export const dashboardQuerySchema = rangeSchema.extend({ vendorId: z.uuid().optional(), category: z.enum(["food", "coffee", "fitness", "books", "services", "other"]).optional(), offerId: z.uuid().optional(), granularity: z.enum(["day", "week", "month"]).optional() });
export const studentQuerySchema = z.strictObject({ q: z.string().max(200).default(""), status: z.enum(["active", "suspended"]).optional(), signedUpFrom: day.optional(), signedUpTo: day.optional(), cursor: z.string().max(512).optional() }).refine(v => !v.signedUpFrom || !v.signedUpTo || v.signedUpFrom <= v.signedUpTo);
const shift = (value: string, amount: number) => { const d = new Date(`${value}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0, 10); };
export function dateRange(input: { from?: string; to?: string }, now = new Date()) {
  const to = input.to ?? cairoParts(now).day;
  const from = input.from ?? shift(to, -29);
  const length = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;
  if (length < 1 || length > 366) throw new Error("Invalid date range");
  return { from, to, previousFrom: shift(from, -length), previousTo: shift(from, -1), days: length };
}
export function autoGranularity(days: number): "day" | "week" | "month" { return days <= 31 ? "day" : days <= 180 ? "week" : "month"; }
export function changePercent(current: number, previous: number): number | null { return previous === 0 ? current === 0 ? 0 : null : Math.round((current - previous) / previous * 1000) / 10; }
export function isAtRisk(redemptions: number, threshold: number) { return redemptions < threshold; }
export function canManageCashier(managerVendorId: string, cashier: { vendorId: string | null; role: string }) { return cashier.role === "cashier" && cashier.vendorId === managerVendorId; }
export function cairoBucket(date: Date, granularity: "day" | "week" | "month") {
  const p = cairoParts(date);
  if (granularity === "day") return p.day;
  if (granularity === "month") return p.day.slice(0, 7);
  return shift(p.day, -p.weekday);
}
export function parseQuery<T>(request: Request, schema: z.ZodType<T>): T {
  const params = new URL(request.url).searchParams;
  return schema.parse(Object.fromEntries(params.entries()));
}
