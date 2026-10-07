import { requireAdmin,json,errorResponse } from "@/lib/student/http";
import { parseQuery,dashboardQuerySchema } from "@/lib/analytics/rules";
import { dashboard } from "@/lib/analytics/service";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{return json(await dashboard(parseQuery(request,dashboardQuerySchema)));}catch(e){return errorResponse(e);}}
