import { z } from "zod";
import { and,desc,eq,lt,or } from "drizzle-orm";
import { db } from "@/lib/db";
import { branches,offers,scanEvents,vendors } from "@/lib/db/schema";
import { requireStudent,json,errorResponse } from "@/lib/student/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){const actor=await requireStudent(request);if(actor instanceof Response)return actor;try{
 const cursor=z.string().max(512).optional().parse(new URL(request.url).searchParams.get("cursor")??undefined);let after:{at:string;id:string}|null=null;
 if(cursor){try{const v=JSON.parse(Buffer.from(cursor,"base64url").toString());if(typeof v.at!=="string"||typeof v.id!=="string"||!Number.isFinite(Date.parse(v.at)))throw Error();after=v;}catch{ return json({error:"Invalid cursor"},400);}}
 const rows=await db.select({id:scanEvents.id,vendorName:vendors.name,branchName:branches.name,offerTitle:offers.title,confirmedAt:scanEvents.confirmedAt,billAmount:scanEvents.billAmount}).from(scanEvents).innerJoin(vendors,eq(scanEvents.vendorId,vendors.id)).innerJoin(branches,eq(scanEvents.branchId,branches.id)).leftJoin(offers,eq(scanEvents.offerId,offers.id)).where(and(eq(scanEvents.studentId,actor.user.id),eq(scanEvents.confirmed,true),eq(scanEvents.voided,false),after?or(lt(scanEvents.confirmedAt,new Date(after.at)),and(eq(scanEvents.confirmedAt,new Date(after.at)),lt(scanEvents.id,after.id))):undefined)).orderBy(desc(scanEvents.confirmedAt),desc(scanEvents.id)).limit(51);
 const page=rows.slice(0,50),last=page.at(-1);return json({redemptions:page.map(r=>({...r,confirmedAt:r.confirmedAt!.toISOString()})),nextCursor:rows.length>50&&last?Buffer.from(JSON.stringify({at:last.confirmedAt!.toISOString(),id:last.id})).toString("base64url"):null});
}catch(e){return errorResponse(e);}}
