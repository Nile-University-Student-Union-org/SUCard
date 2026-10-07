import type { OfferPeriod, ScanResultCode } from "./types";
export type Semester = { name: string; start: string; end: string };
const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" });
export function cairoParts(date: Date) {
  const p = Object.fromEntries(parts.formatToParts(date).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, year: Number(p.year), month: Number(p.month), date: Number(p.day), weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), minutes: Number(p.hour) * 60 + Number(p.minute) };
}
function minute(value: string) { const [h, m] = value.split(":").map(Number); return h * 60 + m; }
function cairoMidnight(day: string): Date {
  // Find the first instant on this Cairo date. Midnight can be skipped when DST begins.
  const utc = Date.parse(`${day}T00:00:00.000Z`);
  let low = utc - 36 * 3600000, high = utc + 36 * 3600000;
  while (high - low > 1000) { const mid = Math.floor((low + high) / 2000) * 1000; if (cairoParts(new Date(mid)).day >= day) high = mid; else low = mid; }
  return new Date(high);
}
function nextDay(day: string, count = 1) { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + count); return d.toISOString().slice(0, 10); }
export function isOfferActiveAt(offer: { status: string; startsAt: string | null; endsAt: string | null; activeDays: number[]; activeFrom: string | null; activeTo: string | null }, date: Date): boolean {
  if (offer.status !== "active") return false;
  const now = cairoParts(date);
  const from = offer.activeFrom === null ? null : minute(offer.activeFrom), to = offer.activeTo === null ? null : minute(offer.activeTo);
  const overnight = from !== null && to !== null && from > to;
  const previous = overnight && now.minutes < to;
  const effectiveDay = previous ? nextDay(now.day, -1) : now.day;
  const weekday = previous ? (now.weekday + 6) % 7 : now.weekday;
  if (offer.startsAt && effectiveDay < offer.startsAt || offer.endsAt && effectiveDay > offer.endsAt) return false;
  if (offer.activeDays.length && !offer.activeDays.includes(weekday)) return false;
  if (from !== null && to !== null) return overnight ? now.minutes >= from || now.minutes < to : now.minutes >= from && now.minutes < to;
  return from !== null ? now.minutes >= from : to !== null ? now.minutes < to : true;
}
export function periodWindow(period: OfferPeriod, date: Date, semesters: Semester[] = []): { start: Date | null; resetsAt: Date | null } {
  if (period === "total" || period === "unlimited") return { start: null, resetsAt: null };
  const p = cairoParts(date); let start = p.day, end = nextDay(start);
  if (period === "week") { start = nextDay(start, -p.weekday); end = nextDay(start, 7); }
  if (period === "month") { start = `${p.year}-${String(p.month).padStart(2, "0")}-01`; end = p.month === 12 ? `${p.year + 1}-01-01` : `${p.year}-${String(p.month + 1).padStart(2, "0")}-01`; }
  if (period === "semester") {
    const current = semesters.find((s) => s.start <= p.day && p.day <= s.end);
    if (current) { start = current.start; end = nextDay(current.end); }
    else if (p.month === 1 || p.month >= 9) { start = `${p.month === 1 ? p.year - 1 : p.year}-09-01`; end = `${p.month === 1 ? p.year : p.year + 1}-02-01`; }
    else if (p.month < 6 || p.month === 6 && p.date <= 14) { start = `${p.year}-02-01`; end = `${p.year}-06-15`; }
    else { start = `${p.year}-06-15`; end = `${p.year}-09-01`; }
  }
  return { start: cairoMidnight(start), resetsAt: cairoMidnight(end) };
}
export function remainingUses(limit: number | null, usedCount: number): number | null { return limit === null ? null : Math.max(0, limit - usedCount); }
export function vendorIsActive(vendor: { status: string; contractStart: string | null; contractEnd: string | null }, branch: { status: string }, date: Date): boolean {
  const day = cairoParts(date).day;
  return vendor.status === "active" && branch.status === "active" && (!vendor.contractStart || day >= vendor.contractStart) && (!vendor.contractEnd || day <= vendor.contractEnd);
}
export function validationOutcome(input: { qrValid: boolean; cardStatus: "missing" | "unassigned" | "void" | "active"; studentActive: boolean; vendorActive: boolean; activeOfferCount: number; availableOfferCount: number }): ScanResultCode {
  if (!input.qrValid) return "invalid_qr";
  if (input.cardStatus === "missing") return "not_su_card";
  if (input.cardStatus === "unassigned") return "card_not_activated";
  if (input.cardStatus === "void") return "card_cancelled";
  if (!input.studentActive) return "student_suspended";
  if (!input.vendorActive) return "vendor_inactive";
  if (!input.activeOfferCount) return "no_active_offer";
  return input.availableOfferCount ? "valid" : "limit_reached";
}
export function confirmDecision(scan: { confirmed: boolean; cashierId: string; result: string; createdAt: Date }, cashierId: string, now: Date): "existing" | "forbidden" | "expired" | "invalid" | "confirm" {
  if (scan.cashierId !== cashierId) return "forbidden";
  if (scan.confirmed) return "existing";
  if (now.getTime() - scan.createdAt.getTime() > 600000) return "expired";
  return scan.result === "valid" ? "confirm" : "invalid";
}
