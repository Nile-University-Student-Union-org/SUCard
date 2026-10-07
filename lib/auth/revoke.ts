import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, session, twoFactor, user } from "@/lib/db/schema";

export async function resetAdminTwoFactor(id: string, actorId: string) {
  return db.transaction(async tx => {
    const [target] = await tx.select({ role: user.role }).from(user).where(eq(user.id, id)).for("update");
    if (!target || target.role !== "admin") return false;
    await tx.delete(twoFactor).where(eq(twoFactor.userId, id));
    await tx.update(user).set({ twoFactorEnabled: false, updatedAt: new Date() }).where(eq(user.id, id));
    await tx.delete(session).where(eq(session.userId, id));
    await tx.insert(auditLog).values({ actorId, action: "staff.two_factor_reset", entity: "staff", entityId: id, data: {} });
    return true;
  });
}
export async function revokeVendorSessions(id: string, actorId: string, vendorId?: string) {
  return db.transaction(async tx => {
    const [target] = await tx.select({ id: user.id, role: user.role, vendorId: user.vendorId }).from(user).where(eq(user.id, id));
    if (!target || target.role !== "cashier" && target.role !== "vendor_manager" || vendorId && (target.role !== "cashier" || target.vendorId !== vendorId)) return false;
    await tx.delete(session).where(eq(session.userId, id));
    await tx.insert(auditLog).values({ actorId, action: "vendor_accounts.sessions_revoked", entity: "user", entityId: id, data: {} });
    return true;
  });
}
