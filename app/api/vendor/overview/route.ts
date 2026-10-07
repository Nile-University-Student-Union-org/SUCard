import { requireManager } from "@/lib/analytics/http";
import { parseQuery,rangeSchema } from "@/lib/analytics/rules";
import { vendorOverview } from "@/lib/analytics/service";
import { json,errorResponse } from "@/lib/vendors/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireManager(request);if(actor instanceof Response)return actor;try{return json(await vendorOverview(actor.vendor,parseQuery(request,rangeSchema)));}catch(e){return errorResponse(e);}}
