import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { offerImages, offers } from "@/lib/db/schema";
import { offerImageUrl } from "@/lib/vendors/offer-image";
import { requireManager } from "@/lib/analytics/http";
import { formatDiscount } from "@/lib/vendors/types";
import { json,errorResponse } from "@/lib/vendors/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireManager(request);if(actor instanceof Response)return actor;try{const rows=await db.select({offer:offers,imageSha:offerImages.sha256}).from(offers).leftJoin(offerImages,eq(offers.id,offerImages.offerId)).where(eq(offers.vendorId,actor.vendor.id));return json({offers:rows.map(({offer:o,imageSha})=>({id:o.id,title:o.title,discountLabel:formatDiscount(o),terms:o.terms,limitCount:o.limitCount,limitPeriod:o.limitPeriod,startsAt:o.startsAt,endsAt:o.endsAt,activeDays:o.activeDays,activeFrom:o.activeFrom,activeTo:o.activeTo,status:o.status,imageUrl:offerImageUrl(o.id,imageSha)}))});}catch(e){return errorResponse(e);}}
