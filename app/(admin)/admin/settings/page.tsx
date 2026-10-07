import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { SettingsManager } from "@/components/admin/settings/settings-manager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await connection();
  const user = await requireAdminPage();

  return <SettingsManager role={user.role} />;
}
