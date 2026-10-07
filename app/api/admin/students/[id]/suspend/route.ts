import { z } from "zod";
import { requireAdmin, parseBody, json, errorResponse } from "@/lib/student/http";
import { setStudentSuspension } from "@/lib/analytics/students";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{const id=z.string().min(1).parse((await params).id);const {reason}=await parseBody(request,z.strictObject({reason:z.string().trim().min(1).max(500)}));return json(await setStudentSuspension([id],"suspend",reason,actor.id));}catch(e){return errorResponse(e);}}
