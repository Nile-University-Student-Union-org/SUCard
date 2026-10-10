import "server-only";
import { createHash } from "node:crypto";
import { eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, offerImages, offerRevisions, offers } from "@/lib/db/schema";
import { offerRevisionSnapshot, VendorError } from "./service";
import { offerImageUrl, validateOfferImage } from "./offer-image";

export async function changeOfferImage(id: string, actorId: string, upload?: { bytes: Buffer; mime: string }) {
  const metadata = upload ? validateOfferImage(upload.bytes, upload.mime) : null;
  const sha256 = upload ? createHash("sha256").update(upload.bytes).digest("hex") : null;
  return db.transaction(async tx => {
    const [offer] = await tx.select().from(offers).where(eq(offers.id, id)).for("update");
    if (!offer) throw new VendorError(404, "Offer not found");
    const [before] = await tx.select({ sha256: offerImages.sha256 }).from(offerImages).where(eq(offerImages.offerId, id));
    if (!upload && !before) throw new VendorError(404, "Offer image not found");
    if (upload && metadata && sha256) {
      await tx.insert(offerImages).values({ offerId: id, bytes: upload.bytes, ...metadata, sha256 })
        .onConflictDoUpdate({ target: offerImages.offerId, set: { bytes: upload.bytes, ...metadata, sha256, updatedAt: new Date() } });
    } else {
      await tx.delete(offerImages).where(eq(offerImages.offerId, id));
    }
    const [updated] = await tx.update(offers).set({ updatedAt: new Date() }).where(eq(offers.id, id)).returning();
    const [last] = await tx.select({ version: max(offerRevisions.version) }).from(offerRevisions).where(eq(offerRevisions.offerId, id));
    await tx.insert(offerRevisions).values({ offerId: id, version: (last.version ?? 0) + 1,
      snapshot: offerRevisionSnapshot(updated, sha256), changedBy: actorId });
    await tx.insert(auditLog).values({ actorId, action: upload ? "offers.image_updated" : "offers.image_deleted", entity: "offer", entityId: id,
      data: { before: { imageSha256: before?.sha256 ?? null }, after: { imageSha256: sha256 } } });
    return { imageUrl: offerImageUrl(id, sha256), sha256 };
  });
}
