import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { CardsManager } from "@/components/admin/cards/cards-manager";

import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cards — SU Card Admin",
  description: "Generate physical cards and export their QR codes for printing.",
};

export default async function AdminCardsPage() {
  await connection();
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <PageHeader
        title="CARDS"
        description="Generate physical cards, manage print lifecycles, and export QR batches."
      />

      {/* Cards Manager Component */}
      <CardsManager />
    </div>
  );
}
