import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { VendorsManager } from "@/components/admin/vendors/vendors-manager";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  await connection();
  await requireAdminPage();

  return <VendorsManager />;
}
