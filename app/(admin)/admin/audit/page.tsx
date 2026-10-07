import type { Metadata } from "next";
import { connection } from "next/server";
import { requireSuperAdminPage } from "@/lib/auth/guards";
import { AuditManager } from "@/components/admin/audit/audit-manager";

export const metadata: Metadata = {
  title: "Audit Log — SU Card Admin",
  description: "Track sensitive administrative operations and security events.",
};

export default async function AdminAuditPage() {
  await connection();
  const user = await requireSuperAdminPage();

  return <AuditManager currentUser={user} />;
}
