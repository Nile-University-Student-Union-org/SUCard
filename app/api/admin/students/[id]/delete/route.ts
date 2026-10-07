import { z } from "zod";
import { requireAdmin, parseBody, json, errorResponse } from "@/lib/student/http";
import { deleteStudent } from "@/lib/analytics/students";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const actor=await requireAdmin(request);if(actor instanceof Response)return actor;try{const id=z.string().min(1).parse((await params).id);const {confirmEmail}=await parseBody(request,z.strictObject({confirmEmail:z.email()}));return json(await deleteStudent(id,confirmEmail,actor.id));}catch(e){return errorResponse(e);}}
