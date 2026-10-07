import { connection } from "next/server";
import { listPublicOffers, type PublicOffer } from "@/lib/vendors/public-offers";
import { OffersCarousel } from "./offers-carousel";

/** Reads live offers on each request; if the database is unreachable the section shows its empty state. */
export async function CurrentOffers() {
  await connection();
  let offers: PublicOffer[] = [];
  try {
    offers = await listPublicOffers();
  } catch (error) {
    console.error("Landing offers unavailable", error);
  }
  return <OffersCarousel offers={offers} />;
}
