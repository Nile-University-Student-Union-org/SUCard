import { z } from "zod";
import { requireAdmin,json,errorResponse } from "@/lib/student/http";
import { parseQuery,rangeSchema } from "@/lib/analytics/rules";
import { vendorStats } from "@/lib/analytics/service";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{return json(await vendorStats(z.uuid().parse((await params).id),parseQuery(request,rangeSchema),true));}catch(e){return errorResponse(e);}}
