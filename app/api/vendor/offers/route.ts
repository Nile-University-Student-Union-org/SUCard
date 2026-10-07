import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { requireManager } from "@/lib/analytics/http";
import { formatDiscount } from "@/lib/vendors/types";
import { json,errorResponse } from "@/lib/vendors/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireManager(request);if(actor instanceof Response)return actor;try{const rows=await db.select().from(offers).where(eq(offers.vendorId,actor.vendor.id));return json({offers:rows.map(o=>({id:o.id,title:o.title,discountLabel:formatDiscount(o),terms:o.terms,limitCount:o.limitCount,limitPeriod:o.limitPeriod,startsAt:o.startsAt,endsAt:o.endsAt,activeDays:o.activeDays,activeFrom:o.activeFrom,activeTo:o.activeTo,status:o.status}))});}catch(e){return errorResponse(e);}}
