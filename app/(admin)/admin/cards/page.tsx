import type { Metadata } from "next";
import { CardsManager } from "@/components/admin/cards/cards-manager";

export const metadata: Metadata = {
  title: "Cards — SU Card Admin",
  description: "Generate physical cards and export their QR codes for printing.",
};

export default function AdminCardsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Description */}
      <div className="space-y-1">
        <h1 className="font-heading text-3xl sm:text-4xl font-normal uppercase tracking-wide text-foreground">
          CARDS
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate physical cards and export their QR codes for printing.
        </p>
      </div>

      {/* Cards Manager Component */}
      <CardsManager />
    </div>
  );
}
