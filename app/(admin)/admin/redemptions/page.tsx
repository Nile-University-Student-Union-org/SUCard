import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { RedemptionsManager } from "@/components/admin/redemptions/redemptions-manager";

export const dynamic = "force-dynamic";

export default async function AdminRedemptionsPage() {
  await connection();
  await requireAdminPage();

  return <RedemptionsManager />;
}
