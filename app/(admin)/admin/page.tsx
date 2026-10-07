import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { AdminDashboardManager } from "@/components/admin/dashboard/admin-dashboard-manager";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await connection();
  await requireAdminPage();

  return <AdminDashboardManager />;
}
