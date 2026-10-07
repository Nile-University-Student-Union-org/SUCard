import { connection } from "next/server";
import { requireVendorManagerPage } from "@/lib/auth/guards";
import { VendorPortalManager } from "@/components/vendor/vendor-portal-manager";

export const dynamic = "force-dynamic";

export default async function VendorPortalPage() {
  await connection();
  await requireVendorManagerPage();

  return <VendorPortalManager />;
}
