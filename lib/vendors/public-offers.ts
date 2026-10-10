import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { offerImages, offers, vendors } from "@/lib/db/schema";
import { offerImageUrl } from "./offer-image";
import { cairoParts } from "./rules";
import { formatDiscount, type VendorCategory } from "./types";

/** What the public landing page may show about an offer: no limits, terms, schedules or contacts. */
export type PublicOffer = { id: string; vendorName: string; logoUrl: string | null; imageUrl: string | null; category: VendorCategory; title: string; discountLabel: string };

/** Visible offers from active partners whose contract and offer dates cover today (Cairo). Time-of-day windows are ignored. */
export async function listPublicOffers(limit = 24): Promise<PublicOffer[]> {
  const day = cairoParts(new Date()).day;
  const rows = await db.select({ offer: offers, vendor: vendors, imageSha: offerImages.sha256 }).from(offers).innerJoin(vendors, eq(offers.vendorId, vendors.id)).leftJoin(offerImages, eq(offers.id, offerImages.offerId))
    .where(and(eq(vendors.status, "active"), eq(offers.status, "active"), eq(offers.visible, true),
      sql`(${vendors.contractStart} is null or ${vendors.contractStart} <= ${day}::date) and (${vendors.contractEnd} is null or ${vendors.contractEnd} >= ${day}::date)`,
      sql`(${offers.startsAt} is null or ${offers.startsAt} <= ${day}::date) and (${offers.endsAt} is null or ${offers.endsAt} >= ${day}::date)`))
    .orderBy(asc(vendors.name), asc(offers.createdAt)).limit(limit);
  return rows.map(({ offer, vendor, imageSha }) => ({ id: offer.id, vendorName: vendor.name, logoUrl: vendor.logoId ? `/api/vendors/${vendor.id}/logo` : null, imageUrl: offerImageUrl(offer.id, imageSha),
    category: vendor.category, title: offer.title, discountLabel: formatDiscount(offer) }));
}
