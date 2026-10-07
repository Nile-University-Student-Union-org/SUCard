export type AdminDecision = "allow" | "setup" | "deny";
export function adminDecision(role: string, loginMethod: string, twoFactorEnabled: boolean): AdminDecision {
  if (role !== "admin" && role !== "super_admin") return "deny";
  if (loginMethod === "microsoft") return "allow";
  return twoFactorEnabled ? "allow" : "setup";
}

export function sessionExpiry(role: string, defaultExpiry: Date, now = new Date()): Date {
  return role === "cashier" ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : defaultExpiry;
}
