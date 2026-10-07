import { z } from "zod";
import { requireAdmin,errorResponse } from "@/lib/student/http";
import { parseQuery,rangeSchema } from "@/lib/analytics/rules";
import { redemptionsCsv } from "@/lib/analytics/exports";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{return await redemptionsCsv(parseQuery(request,rangeSchema.extend({vendorId:z.uuid().optional()})));}catch(e){return errorResponse(e);}}
