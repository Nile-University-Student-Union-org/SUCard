import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { csvResponse } from "./csv";
import { dateRange } from "./rules";
const start=(day:string)=>sql`(${day}::date::timestamp at time zone 'Africa/Cairo')`;
const end=(day:string)=>sql`((${day}::date + 1)::timestamp at time zone 'Africa/Cairo')`;
type Row=Record<string,unknown>;
async function pages(query:(limit:number,offset:number)=>ReturnType<typeof sql>,columns:string[],filename:string){
 const data:unknown[][]=[];
 for(let offset=0;offset<100000;offset+=1000){const batch=(await db.execute(query(1000,offset))).rows as Row[];for(const row of batch)data.push(columns.map(c=>row[c]));if(batch.length<1000)break;}
 return csvResponse(filename,columns,data);
}
const filename=(name:string)=>`${name}-${new Date().toISOString().slice(0,10)}.csv`;
export async function studentsCsv(q:{q:string;status?:string;signedUpFrom?:string;signedUpTo?:string}){
 const needle=`%${q.q.replace(/[\\%_]/g,"\\$&")}%`;
 return pages((limit,offset)=>sql`select u.name,u.email,sp.university_id,sp.status,sp.card_flow,sp.registered_at,
   (select max(se.confirmed_at) from scan_events se where se.student_id=u.id and se.confirmed and not se.voided) last_redemption_at
   from student_profiles sp join "user" u on u.id=sp.user_id where
   (${q.q===""} or u.name ilike ${needle} escape '\' or u.email ilike ${needle} escape '\' or sp.university_id ilike ${needle} escape '\')
   and (${!q.status} or sp.status=${q.status??""})
   and (${!q.signedUpFrom} or sp.registered_at>=${start(q.signedUpFrom??"1900-01-01")})
   and (${!q.signedUpTo} or sp.registered_at<${end(q.signedUpTo??"9999-01-01")})
   order by u.name,u.id limit ${limit} offset ${offset}`,["name","email","university_id","status","card_flow","registered_at","last_redemption_at"],filename("students"));
}
export async function redemptionsCsv(q:{from?:string;to?:string;vendorId?:string}){
 const r=dateRange(q);
 return pages((limit,offset)=>sql`select se.id,se.confirmed_at,v.name vendor,o.title offer,u.name student_name,sp.university_id,se.student_deleted,se.bill_amount
   from scan_events se join vendors v on v.id=se.vendor_id left join offers o on o.id=se.offer_id left join "user" u on u.id=se.student_id left join student_profiles sp on sp.user_id=se.student_id
   where se.confirmed and not se.voided and se.confirmed_at>=${start(r.from)} and se.confirmed_at<${end(r.to)} and (${!q.vendorId} or se.vendor_id=${q.vendorId??"00000000-0000-0000-0000-000000000000"}::uuid)
   order by se.confirmed_at desc,se.id desc limit ${limit} offset ${offset}`,["id","confirmed_at","vendor","offer","student_name","university_id","student_deleted","bill_amount"],filename("redemptions"));
}
export async function vendorsCsv(q:{from?:string;to?:string}){
 const r=dateRange(q);
 return pages((limit,offset)=>sql`select v.id,v.name,v.category,count(se.id)::int redemptions,count(distinct se.student_id)::int unique_students,coalesce(sum(se.bill_amount),0) total_bill
   from vendors v left join scan_events se on se.vendor_id=v.id and se.confirmed and not se.voided and se.confirmed_at>=${start(r.from)} and se.confirmed_at<${end(r.to)} group by v.id order by redemptions desc,v.id limit ${limit} offset ${offset}`,["id","name","category","redemptions","unique_students","total_bill"],filename("vendors"));
}
export async function vendorCsv(vendorId:string,q:{from?:string;to?:string}){
 const r=dateRange(q);
 return pages((limit,offset)=>sql`select to_char(se.confirmed_at at time zone 'Africa/Cairo','YYYY-MM-DD') day,o.title offer,count(*)::int redemptions,count(distinct se.student_id)::int unique_students,coalesce(sum(se.bill_amount),0) total_bill
   from scan_events se left join offers o on o.id=se.offer_id where se.vendor_id=${vendorId}::uuid and se.confirmed and not se.voided and se.confirmed_at>=${start(r.from)} and se.confirmed_at<${end(r.to)} group by 1,o.id order by day,o.title limit ${limit} offset ${offset}`,["day","offer","redemptions","unique_students","total_bill"],filename("vendor-stats"));
}
