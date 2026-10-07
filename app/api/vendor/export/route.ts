import { requireManager } from "@/lib/analytics/http";
import { parseQuery,rangeSchema } from "@/lib/analytics/rules";
import { vendorCsv } from "@/lib/analytics/exports";
import { errorResponse } from "@/lib/vendors/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireManager(request);if(actor instanceof Response)return actor;try{return await vendorCsv(actor.vendor.id,parseQuery(request,rangeSchema));}catch(e){return errorResponse(e);}}
