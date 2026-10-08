import { parseQrPayload } from "@/lib/cards/token";
import { UNIVERSITY_ID_REGEX, type Area, type CardFlow, type ClaimErrorCode, type IssuanceSetting } from "./types";

export { UNIVERSITY_ID_REGEX };
export const DEFAULT_STUDENT_EMAIL_PATTERN = "^[a-z]\\.[a-z]+\\d{4}@nu\\.edu\\.eg$";
export function isSafeStudentEmailPattern(pattern: string): boolean {
  if (pattern.length > 160 || !pattern.startsWith("^") || !pattern.endsWith("$")) return false;
  const withoutCounts = pattern.replace(/\{[1-9][0-9]?\}/g, "");
  if (/[{}]/.test(withoutCounts) || (withoutCounts.match(/\+/g) ?? []).length > 1) return false;
  if (!/^[\^$a-zA-Z0-9@.\\\[\]_+\-]+$/.test(withoutCounts)) return false;
  try { new RegExp(pattern); return true; } catch { return false; }
}
export function matchesStudentEmail(email: string, pattern = DEFAULT_STUDENT_EMAIL_PATTERN): boolean {
  return email.length <= 320 && isSafeStudentEmailPattern(pattern) && new RegExp(pattern, "i").test(email.toLowerCase());
}
export function parseClaimQr(raw: string): string | null {
  const input = raw.trim();
  if (/^NUSU1:/i.test(input)) return parseQrPayload(input);
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.search || url.hash || !url.hostname) return null;
    return parseQrPayload(input);
  } catch { return null; }
}
export function decideFlow(setting: IssuanceSetting): { flow: CardFlow; next: IssuanceSetting; switched: boolean } {
  if (setting.mode === "digital") return { flow: "digital", next: setting, switched: false };
  if (setting.physicalQuotaRemaining === null) return { flow: "physical", next: setting, switched: false };
  if (setting.physicalQuotaRemaining <= 0) return { flow: "digital", next: { mode: "digital", physicalQuotaRemaining: 0 }, switched: true };
  const remaining = setting.physicalQuotaRemaining - 1;
  return { flow: "physical", next: { mode: remaining === 0 ? "digital" : "physical", physicalQuotaRemaining: remaining }, switched: remaining === 0 };
}
export function claimDecision(card: { status: "unassigned" | "active" | "void" } | null, activeType: CardFlow | null, allowUpgrade: boolean): ClaimErrorCode | "link" | "upgrade" {
  if (!card) return "not_su_card";
  if (card.status === "void") return "cancelled";
  if (card.status === "active") return "already_linked";
  if (activeType === "physical" || activeType === "digital" && !allowUpgrade) return "already_has_card";
  return activeType === "digital" ? "upgrade" : "link";
}
export function computeAreas(hasProfile: boolean, needsProfile: boolean, role: string, disabled: boolean): Area[] {
  if (disabled) return [];
  const areas: Area[] = [];
  if (hasProfile || needsProfile) areas.push({ key: "student", label: "My SU Card", href: "/card" });
  if (role === "admin" || role === "super_admin") areas.push({ key: "admin", label: "Admin panel", href: "/admin/cards" });
  if (role === "cashier") areas.push({ key: "scanner", label: "Scanner", href: "/scan" });
  if (role === "vendor_manager") areas.push({ key: "vendor", label: "Vendor portal", href: "/vendor" });
  return areas;
}
export function goDestination(areas: Area[], needsProfile: boolean, preferred?: string): string {
  if (needsProfile) return "/welcome";
  if (!areas.length) return "/login?error=no_access";
  if (areas.length === 1) return areas[0].href;
  return areas.find((area) => area.key === preferred)?.href ?? "/choose";
}
