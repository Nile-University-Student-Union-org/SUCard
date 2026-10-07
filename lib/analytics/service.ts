import "server-only";
import { sql, and, eq, desc, lt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { branches, offers, scanEvents, studentProfiles, user, vendors, cards, walletPasses } from "@/lib/db/schema";
import { formatSerial } from "@/lib/cards/token";
import { dateRange, autoGranularity, changePercent, isAtRisk } from "./rules";
import { getSettings } from "@/lib/settings/service";
import type { DashboardResponse, VendorStatsResponse, VendorOverviewResponse, StudentDetailResponse } from "./types";

const n = (value: unknown) => Number(value ?? 0);
const start = (day: string) => sql`(${day}::date::timestamp at time zone 'Africa/Cairo')`;
const end = (day: string) => sql`((${day}::date + 1)::timestamp at time zone 'Africa/Cairo')`;
const redeemed = sql`se.confirmed = true and se.voided = false`;
const between = (from: string, to: string) => sql`se.confirmed_at >= ${start(from)} and se.confirmed_at < ${end(to)}`;
const logo = (id: string | null) => id ? `/api/vendors/${id}/logo` : null;
function bucket(granularity: "day" | "week" | "month") {
  if (granularity === "day") return sql`to_char(se.confirmed_at at time zone 'Africa/Cairo', 'YYYY-MM-DD')`;
  if (granularity === "month") return sql`to_char(se.confirmed_at at time zone 'Africa/Cairo', 'YYYY-MM')`;
  return sql`to_char(date_trunc('week', se.confirmed_at at time zone 'Africa/Cairo' + interval '1 day') - interval '1 day', 'YYYY-MM-DD')`;
}
async function rows<T>(query: ReturnType<typeof sql>): Promise<T[]> { return (await db.execute(query)).rows as T[]; }
function filter(input: { vendorId?: string; category?: string; offerId?: string }) {
  return sql`${input.vendorId ? sql`and se.vendor_id = ${input.vendorId}::uuid` : sql``}${input.category ? sql` and v.category = ${input.category}` : sql``}${input.offerId ? sql` and se.offer_id = ${input.offerId}::uuid` : sql``}`;
}
export async function dashboard(input: { from?: string; to?: string; vendorId?: string; category?: string; offerId?: string; granularity?: "day" | "week" | "month" }): Promise<DashboardResponse> {
  const range = dateRange(input), granularity = input.granularity ?? autoGranularity(range.days), where = filter(input);
  const [totals] = await rows<{ current: string; previous: string; unique_current: string; unique_previous: string }>(sql`
    select count(*) filter (where ${between(range.from, range.to)})::text current,
      count(*) filter (where ${between(range.previousFrom, range.previousTo)})::text previous,
      count(distinct se.student_id) filter (where ${between(range.from, range.to)})::text unique_current,
      count(distinct se.student_id) filter (where ${between(range.previousFrom, range.previousTo)})::text unique_previous
    from scan_events se join vendors v on v.id=se.vendor_id where ${redeemed} and ${between(range.previousFrom, range.to)} ${where}`);
  const [time, leader, base, settings] = await Promise.all([
    rows<{ bucket: string; redemptions: string }>(sql`select ${bucket(granularity)} bucket, count(*)::text redemptions from scan_events se join vendors v on v.id=se.vendor_id where ${redeemed} and ${between(range.from, range.to)} ${where} group by 1 order by 1`),
    rows<{ id: string; name: string; logo_id: string | null; category: string; redemptions: string; unique_students: string; previous_redemptions: string }>(sql`select v.id, v.name, v.logo_id, v.category,
      count(se.id) filter (where ${between(range.from, range.to)})::text redemptions,
      count(distinct se.student_id) filter (where ${between(range.from, range.to)})::text unique_students,
      count(se.id) filter (where ${between(range.previousFrom, range.previousTo)})::text previous_redemptions
      from vendors v left join scan_events se on se.vendor_id=v.id and ${redeemed} and ${between(range.previousFrom, range.to)} ${input.offerId ? sql`and se.offer_id=${input.offerId}::uuid` : sql``}
      where ${input.vendorId ? sql`v.id=${input.vendorId}::uuid` : sql`true`} and ${input.category ? sql`v.category=${input.category}` : sql`true`}
      group by v.id order by count(se.id) filter (where ${between(range.from, range.to)}) desc, v.name`),
    rows<{ active_vendors: string; digital: string; physical: string; printed: string; unassigned: string; activated: string; pending: string; wallets: string; holders: string; used_holders: string }>(sql`select
      (select count(*) from vendors where status='active')::text active_vendors,
      (select count(*) from cards where type='digital')::text digital,
      (select count(*) from cards where type='physical')::text physical,
      (select count(*) from cards where type='physical')::text printed,
      (select count(*) from cards where type='physical' and status='unassigned')::text unassigned,
      (select count(*) from cards where type='physical' and status='active')::text activated,
      (select count(*) from student_profiles sp where sp.card_flow='physical' and not exists (select 1 from cards c where c.student_id=sp.user_id and c.status='active'))::text pending,
      (select count(*) from wallet_passes)::text wallets,
      (select count(distinct student_id) from cards where status='active')::text holders,
      (select count(distinct se.student_id) from scan_events se join cards c on c.student_id=se.student_id and c.status='active' where se.confirmed and not se.voided)::text used_holders`),
    getSettings(),
  ]);
  const cfg = settings.atRisk;
  const atRiskRows = await rows<{ id: string; name: string; redemptions: string }>(sql`select v.id, v.name, count(se.id)::text redemptions from vendors v left join scan_events se on se.vendor_id=v.id and ${redeemed} and se.confirmed_at >= (((now() at time zone 'Africa/Cairo')::date - (${cfg.days}::int - 1))::timestamp at time zone 'Africa/Cairo') where v.status='active' group by v.id having count(se.id) < ${cfg.redemptions} order by count(se.id), v.name`);
  const b=base[0], cur=n(totals.current), prev=n(totals.previous), uc=n(totals.unique_current), up=n(totals.unique_previous);
  return { range, granularity, kpis: { redemptions: { current: cur, previous: prev, changePercent: changePercent(cur, prev) }, uniqueStudents: { current: uc, previous: up, changePercent: changePercent(uc, up) }, activeVendors: n(b.active_vendors), cardsByType: { digital: n(b.digital), physical: n(b.physical) }, physical: { printed: n(b.printed), unassigned: n(b.unassigned), activated: n(b.activated) }, pendingPhysicalStudents: n(b.pending), walletPassesIssued: n(b.wallets), cardholderRedemptionPercent: n(b.holders) ? Math.round(n(b.used_holders)/n(b.holders)*1000)/10 : 0 }, timeseries: time.map(x => ({ bucket: x.bucket, redemptions: n(x.redemptions) })), leaderboard: leader.map(x => ({ id: x.id, name: x.name, logoUrl: logo(x.logo_id), category: x.category, redemptions: n(x.redemptions), uniqueStudents: n(x.unique_students), previousRedemptions: n(x.previous_redemptions), changePercent: changePercent(n(x.redemptions), n(x.previous_redemptions)) })), atRisk: atRiskRows.filter(x => isAtRisk(n(x.redemptions), cfg.redemptions)).map(x => ({ id:x.id, name:x.name, redemptions:n(x.redemptions), threshold:cfg.redemptions, days:cfg.days })) };
}

export async function vendorStats(vendorId: string, input: { from?: string; to?: string }, includeRecent = false): Promise<VendorStatsResponse> {
  if(!(await db.select({id:vendors.id}).from(vendors).where(eq(vendors.id,vendorId))).length) throw new Error("Vendor not found");
  const range = dateRange(input), granularity = autoGranularity(range.days);
  const [counts, time, branchRows, offerRows, days, hours, recent] = await Promise.all([
    rows<{ current:string; previous:string; unique_current:string; unique_previous:string; bill:string; bill_count:string }>(sql`select count(*) filter(where ${between(range.from,range.to)})::text current, count(*) filter(where ${between(range.previousFrom,range.previousTo)})::text previous, count(distinct se.student_id) filter(where ${between(range.from,range.to)})::text unique_current, count(distinct se.student_id) filter(where ${between(range.previousFrom,range.previousTo)})::text unique_previous, coalesce(sum(se.bill_amount) filter(where ${between(range.from,range.to)}),0)::text bill, count(se.bill_amount) filter(where ${between(range.from,range.to)})::text bill_count from scan_events se where ${redeemed} and se.vendor_id=${vendorId}::uuid and ${between(range.previousFrom,range.to)}`),
    rows<{ bucket:string; redemptions:string }>(sql`select ${bucket(granularity)} bucket,count(*)::text redemptions from scan_events se where ${redeemed} and se.vendor_id=${vendorId}::uuid and ${between(range.from,range.to)} group by 1 order by 1`),
    rows<{ id:string; name:string; redemptions:string }>(sql`select b.id,b.name,count(se.id)::text redemptions from branches b left join scan_events se on se.branch_id=b.id and ${redeemed} and ${between(range.from,range.to)} where b.vendor_id=${vendorId}::uuid group by b.id order by redemptions desc`),
    rows<{ id:string; name:string; redemptions:string }>(sql`select o.id,o.title name,count(se.id)::text redemptions from offers o left join scan_events se on se.offer_id=o.id and ${redeemed} and ${between(range.from,range.to)} where o.vendor_id=${vendorId}::uuid group by o.id order by redemptions desc`),
    rows<{ value:string; redemptions:string }>(sql`select extract(dow from se.confirmed_at at time zone 'Africa/Cairo')::int::text value,count(*)::text redemptions from scan_events se where ${redeemed} and se.vendor_id=${vendorId}::uuid and ${between(range.from,range.to)} group by 1 order by 1`),
    rows<{ value:string; redemptions:string }>(sql`select extract(hour from se.confirmed_at at time zone 'Africa/Cairo')::int::text value,count(*)::text redemptions from scan_events se where ${redeemed} and se.vendor_id=${vendorId}::uuid and ${between(range.from,range.to)} group by 1 order by 1`),
    includeRecent ? rows<{ id:string; student_name:string|null; university_id:string|null; branch_name:string; offer_title:string|null; bill_amount:string|null; confirmed_at:Date }>(sql`select se.id,u.name student_name,sp.university_id,b.name branch_name,o.title offer_title,se.bill_amount,se.confirmed_at from scan_events se left join "user" u on u.id=se.student_id left join student_profiles sp on sp.user_id=se.student_id join branches b on b.id=se.branch_id left join offers o on o.id=se.offer_id where ${redeemed} and se.vendor_id=${vendorId}::uuid and ${between(range.from,range.to)} order by se.confirmed_at desc,se.id desc limit 20`) : Promise.resolve([]),
  ]);
  const c=counts[0], current=n(c.current), previous=n(c.previous), unique=n(c.unique_current), uniquePrevious=n(c.unique_previous);
  return { range, redemptions:{ current,previous,changePercent:changePercent(current,previous) }, uniqueStudents:{ current:unique,previous:uniquePrevious,changePercent:changePercent(unique,uniquePrevious) }, totalBill:c.bill, averageBill:n(c.bill_count) ? (n(c.bill)/n(c.bill_count)).toFixed(2):null, timeseries:time.map(x=>({bucket:x.bucket,redemptions:n(x.redemptions)})), branches:branchRows.map(x=>({id:x.id,name:x.name,redemptions:n(x.redemptions)})), offers:offerRows.map(x=>({id:x.id,name:x.name,redemptions:n(x.redemptions)})), peakDays:Array.from({length:7},(_,value)=>({value,redemptions:n(days.find(x=>n(x.value)===value)?.redemptions)})), peakHours:Array.from({length:24},(_,value)=>({value,redemptions:n(hours.find(x=>n(x.value)===value)?.redemptions)})), ...(includeRecent ? {recent:recent.map(x=>({id:x.id,studentName:x.student_name,universityId:x.university_id,branchName:x.branch_name,offerTitle:x.offer_title,billAmount:x.bill_amount,confirmedAt:x.confirmed_at instanceof Date ? x.confirmed_at.toISOString() : new Date(x.confirmed_at).toISOString()}))}:{}) };
}
export async function vendorOverview(vendor: typeof vendors.$inferSelect, input: {from?:string;to?:string}):Promise<VendorOverviewResponse> { return {vendor:{id:vendor.id,name:vendor.name,logoUrl:logo(vendor.logoId),status:vendor.status},...(await vendorStats(vendor.id,input))}; }

export async function studentDetail(id:string,cursor?:string):Promise<StudentDetailResponse|null> {
  const [person] = await db.select({u:user,p:studentProfiles}).from(user).innerJoin(studentProfiles,eq(user.id,studentProfiles.userId)).where(eq(user.id,id));
  if(!person) return null;
  const cardRows=await db.select().from(cards).where(eq(cards.studentId,id)).orderBy(desc(cards.createdAt));
  const passes=await db.select().from(walletPasses).where(eq(walletPasses.studentId,id));
  let after:{at:string;id:string}|null=null;
  if(cursor){ try { const v=JSON.parse(Buffer.from(cursor,"base64url").toString()); if(typeof v.at!=="string"||typeof v.id!=="string"||!Number.isFinite(Date.parse(v.at))) throw Error(); after=v; } catch {throw new Error("Invalid cursor");} }
  const redemptions=await db.select({id:scanEvents.id,vendorName:vendors.name,branchName:branches.name,offerTitle:offers.title,confirmedAt:scanEvents.confirmedAt,billAmount:scanEvents.billAmount}).from(scanEvents).innerJoin(vendors,eq(scanEvents.vendorId,vendors.id)).innerJoin(branches,eq(scanEvents.branchId,branches.id)).leftJoin(offers,eq(scanEvents.offerId,offers.id)).where(and(eq(scanEvents.studentId,id),eq(scanEvents.confirmed,true),eq(scanEvents.voided,false),after?or(lt(scanEvents.confirmedAt,new Date(after.at)),and(eq(scanEvents.confirmedAt,new Date(after.at)),lt(scanEvents.id,after.id))):undefined)).orderBy(desc(scanEvents.confirmedAt),desc(scanEvents.id)).limit(51);
  const page=redemptions.slice(0,50),last=page.at(-1);
  return {id,name:person.u.name,email:person.u.email,profile:{universityId:person.p.universityId,cardFlow:person.p.cardFlow,status:person.p.status,suspendReason:person.p.suspendReason,registeredAt:person.p.registeredAt.toISOString()},cards:cardRows.map(c=>({id:c.id,type:c.type,serial:formatSerial(c.serialNumber),status:c.status,linkedAt:c.linkedAt?.toISOString()??null,voidedAt:c.voidedAt?.toISOString()??null,voidReason:c.voidReason})),walletPasses:passes.map(p=>({platform:p.platform,objectId:p.objectId,firstIssuedAt:p.firstIssuedAt.toISOString(),lastSyncedAt:p.lastSyncedAt.toISOString()})),redemptions:page.map(r=>({...r,confirmedAt:r.confirmedAt!.toISOString()})),nextCursor:redemptions.length>50&&last?Buffer.from(JSON.stringify({at:last.confirmedAt!.toISOString(),id:last.id})).toString("base64url"):null};
}
