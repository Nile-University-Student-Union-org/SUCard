import { z } from "zod";
import { and,eq,inArray,sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { offerImages,offers,vendors,scanEvents } from "@/lib/db/schema";
import { offerImageUrl } from "@/lib/vendors/offer-image";
import { requireStudent,json,errorResponse } from "@/lib/student/http";
import { parseQuery } from "@/lib/analytics/rules";
import { cairoParts,isOfferActiveAt,periodWindow,remainingUses } from "@/lib/vendors/rules";
import { formatDiscount } from "@/lib/vendors/types";
import { getSettings } from "@/lib/settings/service";
export const dynamic="force-dynamic";
const query=z.strictObject({q:z.string().max(200).default(""),category:z.enum(["food","coffee","fitness","books","services","other"]).optional()});
export async function GET(request:Request){const actor=await requireStudent(request);if(actor instanceof Response)return actor;try{
 const input=parseQuery(request,query),now=new Date(),day=cairoParts(now).day;
 const rows=await db.select({offer:offers,vendor:vendors,imageSha:offerImages.sha256}).from(offers).innerJoin(vendors,eq(offers.vendorId,vendors.id)).leftJoin(offerImages,eq(offerImages.offerId,offers.id)).where(and(eq(vendors.status,"active"),eq(offers.status,"active"),eq(offers.visible,true),input.category?eq(vendors.category,input.category):undefined,sql`(${vendors.contractStart} is null or ${vendors.contractStart} <= ${day}::date) and (${vendors.contractEnd} is null or ${vendors.contractEnd} >= ${day}::date)`));
 const visible=rows.filter(r=>isOfferActiveAt(r.offer,now)&&(!input.q||`${r.vendor.name} ${r.offer.title} ${r.offer.description??""}`.toLowerCase().includes(input.q.toLowerCase())));
 const ids=visible.map(r=>r.offer.id),settings=await getSettings();
 const counts=ids.length?await db.select({offerId:scanEvents.offerId,used:sql<number>`count(*)::int`}).from(scanEvents).where(and(eq(scanEvents.studentId,actor.user.id),inArray(scanEvents.offerId,ids),eq(scanEvents.confirmed,true),eq(scanEvents.voided,false))).groupBy(scanEvents.offerId):[];
 // Per-period counts use one grouped SQL query per distinct window, never one scan query per deal.
 const windows=new Map<string,{start:Date|null;resetsAt:Date|null;ids:string[]}>();
 for(const {offer} of visible){const w=periodWindow(offer.limitPeriod,now,settings.semesters);const key=w.start?.toISOString()??"all";const item=windows.get(key)??{...w,ids:[]};item.ids.push(offer.id);windows.set(key,item);}
 const used=new Map<string,number>(counts.map(c=>[c.offerId!,Number(c.used)]));
 for(const w of windows.values())if(w.start){const grouped=await db.select({offerId:scanEvents.offerId,used:sql<number>`count(*)::int`}).from(scanEvents).where(and(eq(scanEvents.studentId,actor.user.id),inArray(scanEvents.offerId,w.ids),eq(scanEvents.confirmed,true),eq(scanEvents.voided,false),sql`${scanEvents.confirmedAt} >= ${w.start}`)).groupBy(scanEvents.offerId);for(const id of w.ids)used.set(id,0);for(const c of grouped)used.set(c.offerId!,Number(c.used));}
 return json({deals:visible.map(({offer,vendor,imageSha})=>{const window=periodWindow(offer.limitPeriod,now,settings.semesters);return {vendorId:vendor.id,vendorName:vendor.name,logoUrl:vendor.logoId?`/api/vendors/${vendor.id}/logo`:null,imageUrl:offerImageUrl(offer.id,imageSha),category:vendor.category,location:vendor.location,offerId:offer.id,title:offer.title,discountLabel:formatDiscount(offer),terms:offer.terms,limitText:offer.limitPeriod==="unlimited"?"Unlimited":`${offer.limitCount} per ${offer.limitPeriod}`,scheduleText:offer.activeDays.length?`Days ${offer.activeDays.join(", ")}${offer.activeFrom?` ${offer.activeFrom}–${offer.activeTo??"end"}`:""}`:offer.activeFrom?`${offer.activeFrom}–${offer.activeTo??"end"}`:"Any day",remainingUses:offer.limitPeriod==="unlimited"?null:remainingUses(offer.limitCount,used.get(offer.id)??0),resetsAt:window.resetsAt?.toISOString()??null};})});
}catch(e){return errorResponse(e);}}
