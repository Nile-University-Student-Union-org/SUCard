import { connection } from "next/server";
import { requireCashierPage } from "@/lib/auth/guards";
import { getAreas } from "@/lib/student/service";
import { vendorIsActive } from "@/lib/vendors/rules";
import { ScannerManager } from "@/components/scanner/scanner-manager";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  await connection();

  const actor = await requireCashierPage();
  const areas = await getAreas(actor.person);

  const initialContext = {
    cashierName: actor.person.name,
    vendorName: actor.vendor.name,
    vendorLogoUrl: actor.vendor.logoId
      ? `/api/vendors/${actor.vendor.id}/logo`
      : null,
    vendorActive: vendorIsActive(actor.vendor, new Date()),
  };

  const user = {
    id: actor.person.id,
    name: actor.person.name,
    email: actor.person.email,
    role: actor.person.role,
  };

  return (
    <ScannerManager
      initialContext={initialContext}
      user={user}
      areas={areas}
    />
  );
}
