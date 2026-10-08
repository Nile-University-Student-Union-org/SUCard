export type AdminDecision = "allow" | "setup" | "verify" | "deny";
export function resolveAdminRole(storedRole: string, loginMethod: string, activeGrant: boolean): "admin" | "super_admin" | null {
  if (storedRole === "admin" || storedRole === "super_admin") return storedRole;
  return storedRole === "student" && loginMethod === "microsoft" && activeGrant ? "admin" : null;
}
export function adminDecision(role: string, loginMethod: string, twoFactorEnabled: boolean, sessionVerified = false): AdminDecision {
  if (role !== "admin" && role !== "super_admin") return "deny";
  if (!twoFactorEnabled) return "setup";
  return loginMethod === "microsoft" && !sessionVerified ? "verify" : "allow";
}

export function sessionExpiry(role: string, defaultExpiry: Date, now = new Date()): Date {
  return role === "cashier" ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : defaultExpiry;
}
