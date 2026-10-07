import { z } from "zod";
import { requireManager } from "@/lib/analytics/http";
import { updateCashier } from "@/lib/analytics/vendor";
import { accountPatch } from "@/lib/vendors/validation";
import { json,errorResponse,parseBody } from "@/lib/vendors/http";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const actor=await requireManager(request);if(actor instanceof Response)return actor;try{const id=z.string().min(1).parse((await params).id);const patch=await parseBody(request,accountPatch);return json(await updateCashier(actor.vendor.id,id,{name:patch.name,branchId:patch.branchId??undefined,status:patch.status},actor.person.id));}catch(e){return errorResponse(e);}}
