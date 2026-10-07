import { z } from "zod";
import { requireAdmin, json, errorResponse } from "@/lib/student/http";
import { setStudentSuspension } from "@/lib/analytics/students";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{const id=z.string().min(1).parse((await params).id);return json(await setStudentSuspension([id],"reactivate",null,actor.id));}catch(e){return errorResponse(e);}}
