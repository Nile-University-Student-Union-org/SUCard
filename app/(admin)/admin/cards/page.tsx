import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { CardsManager } from "@/components/admin/cards/cards-manager";

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
      {/* Page Title & Description */}
      <div className="space-y-1">
        <h1 className="font-heading text-3xl sm:text-4xl font-normal uppercase tracking-wide text-foreground">
          CARDS
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Generate physical cards, manage print lifecycles, and export QR batches.
        </p>
      </div>

      {/* Cards Manager Component */}
      <CardsManager />
    </div>
  );
}
