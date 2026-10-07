import { requireAdmin,errorResponse } from "@/lib/student/http";
import { parseQuery,rangeSchema } from "@/lib/analytics/rules";
import { vendorsCsv } from "@/lib/analytics/exports";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{return await vendorsCsv(parseQuery(request,rangeSchema));}catch(e){return errorResponse(e);}}
