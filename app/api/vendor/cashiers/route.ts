import { and,eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireManager } from "@/lib/analytics/http";
import { accountBody } from "@/lib/vendors/validation";
import { createAccount } from "@/lib/vendors/service";
import { json,errorResponse,parseBody } from "@/lib/vendors/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireManager(request);if(actor instanceof Response)return actor;try{const rows=await db.select({id:user.id,email:user.email,name:user.name,disabledAt:user.disabledAt}).from(user).where(and(eq(user.vendorId,actor.vendor.id),eq(user.role,"cashier")));return json({cashiers:rows.map(r=>({id:r.id,email:r.email,name:r.name,status:r.disabledAt?"disabled":"active"}))});}catch(e){return errorResponse(e);}}
export async function POST(request:Request){const actor=await requireManager(request);if(actor instanceof Response)return actor;try{const body=await parseBody(request,accountBody.omit({role:true}));return json(await createAccount(actor.vendor.id,{...body,role:"cashier"},actor.person.id),201);}catch(e){return errorResponse(e);}}
