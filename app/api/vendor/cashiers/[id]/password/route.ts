import { z } from "zod";
import { requireManager } from "@/lib/analytics/http";
import { resetCashierPassword } from "@/lib/analytics/vendor";
import { passwordBody } from "@/lib/vendors/validation";
import { errorResponse,parseBody } from "@/lib/vendors/http";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const actor=await requireManager(request);if(actor instanceof Response)return actor;try{const id=z.string().min(1).parse((await params).id);const {password}=await parseBody(request,passwordBody);await resetCashierPassword(actor.vendor.id,id,password,actor.person.id);return new Response(null,{status:204});}catch(e){return errorResponse(e);}}
