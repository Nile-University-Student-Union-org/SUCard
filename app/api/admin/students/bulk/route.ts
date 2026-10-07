import { z } from "zod";
import { requireAdmin, parseBody, json, errorResponse } from "@/lib/student/http";
import { setStudentSuspension } from "@/lib/analytics/students";
const body=z.strictObject({action:z.enum(["suspend","reactivate"]),ids:z.array(z.string().min(1)).min(1).max(500),reason:z.string().trim().min(1).max(500).optional()}).refine(v=>v.action!=="suspend"||!!v.reason);
export async function POST(request:Request){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{const v=await parseBody(request,body);return json(await setStudentSuspension([...new Set(v.ids)],v.action,v.reason??null,actor.id));}catch(e){return errorResponse(e);}}
