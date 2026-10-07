import { requireAdmin,errorResponse } from "@/lib/student/http";
import { parseQuery,studentQuerySchema } from "@/lib/analytics/rules";
import { studentsCsv } from "@/lib/analytics/exports";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{return await studentsCsv(parseQuery(request,studentQuerySchema));}catch(e){return errorResponse(e);}}
