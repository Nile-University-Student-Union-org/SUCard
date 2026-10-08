import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { csvStreamResponse } from "./csv";
import { dateRange } from "./rules";

const start = (day: string) => sql`(${day}::date::timestamp at time zone 'Africa/Cairo')`;
const end = (day: string) => sql`((${day}::date + 1)::timestamp at time zone 'Africa/Cairo')`;
type Row = Record<string, unknown>;
type PageQuery = (cursor: Row | null) => SQL;

async function* pages(query: PageQuery, columns: string[]) {
  let cursor: Row | null = null;
  for (;;) {
    const batch = (await db.execute(query(cursor))).rows as Row[];
    for (const row of batch) yield columns.map((column) => row[column]);
    if (batch.length < 500) return;
    cursor = batch[batch.length - 1];
  }
}
const filename = (name: string) => `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
const exportCsv = (name: string, columns: string[], query: PageQuery) =>
  csvStreamResponse(filename(name), columns, pages(query, columns));

export function studentsCsv(q: { q: string; status?: string; signedUpFrom?: string; signedUpTo?: string }) {
  const needle = `%${q.q.replace(/[\\%_]/g, "\\$&")}%`;
  return exportCsv("students", ["name", "email", "university_id", "status", "card_flow", "registered_at", "last_redemption_at"],
    (cursor) => sql`select u.name,u.email,sp.university_id,sp.status,sp.card_flow,sp.registered_at,u.id,
      (select max(se.confirmed_at) from scan_events se where se.student_id=u.id and se.confirmed and not se.voided) last_redemption_at
      from student_profiles sp join "user" u on u.id=sp.user_id where
      (${q.q === ""} or u.name ilike ${needle} escape '\' or u.email ilike ${needle} escape '\' or sp.university_id ilike ${needle} escape '\')
      and (${!q.status} or sp.status=${q.status ?? ""})
      and (${!q.signedUpFrom} or sp.registered_at>=${start(q.signedUpFrom ?? "1900-01-01")})
      and (${!q.signedUpTo} or sp.registered_at<${end(q.signedUpTo ?? "9999-01-01")})
      and (${!cursor} or (u.name,u.id)>(${cursor?.name as string ?? ""},${cursor?.id as string ?? ""}))
      order by u.name,u.id limit 500`);
}
export function redemptionsCsv(q: { from?: string; to?: string; vendorId?: string }) {
  const range = dateRange(q);
  return exportCsv("redemptions", ["id", "confirmed_at", "vendor", "offer", "student_name", "university_id", "student_deleted", "bill_amount"],
    (cursor) => sql`select se.id,se.confirmed_at,v.name vendor,o.title offer,u.name student_name,sp.university_id,se.student_deleted,se.bill_amount
      from scan_events se join vendors v on v.id=se.vendor_id left join offers o on o.id=se.offer_id left join "user" u on u.id=se.student_id left join student_profiles sp on sp.user_id=se.student_id
      where se.confirmed and not se.voided and se.confirmed_at>=${start(range.from)} and se.confirmed_at<${end(range.to)}
      and (${!q.vendorId} or se.vendor_id=${q.vendorId ?? "00000000-0000-0000-0000-000000000000"}::uuid)
      and (${!cursor} or (se.confirmed_at,se.id)<(${cursor?.confirmed_at as Date ?? new Date(0)},${cursor?.id as string ?? "00000000-0000-0000-0000-000000000000"}::uuid))
      order by se.confirmed_at desc,se.id desc limit 500`);
}
export function vendorsCsv(q: { from?: string; to?: string }) {
  const range = dateRange(q);
  return exportCsv("vendors", ["id", "name", "category", "redemptions", "unique_students", "total_bill"],
    (cursor) => sql`select v.id,v.name,v.category,count(se.id)::int redemptions,count(distinct se.student_id)::int unique_students,coalesce(sum(se.bill_amount),0) total_bill
      from vendors v left join scan_events se on se.vendor_id=v.id and se.confirmed and not se.voided and se.confirmed_at>=${start(range.from)} and se.confirmed_at<${end(range.to)}
      where (${!cursor} or v.id>${cursor?.id as string ?? "00000000-0000-0000-0000-000000000000"}::uuid)
      group by v.id order by v.id limit 500`);
}
export function vendorCsv(vendorId: string, q: { from?: string; to?: string }) {
  const range = dateRange(q);
  return exportCsv("vendor-stats", ["day", "offer", "redemptions", "unique_students", "total_bill"],
    (cursor) => sql`with grouped as (
      select to_char(se.confirmed_at at time zone 'Africa/Cairo','YYYY-MM-DD') day,o.id offer_id,o.title offer,
      count(*)::int redemptions,count(distinct se.student_id)::int unique_students,coalesce(sum(se.bill_amount),0) total_bill
      from scan_events se left join offers o on o.id=se.offer_id where se.vendor_id=${vendorId}::uuid and se.confirmed and not se.voided
      and se.confirmed_at>=${start(range.from)} and se.confirmed_at<${end(range.to)} group by 1,o.id
    ) select * from grouped where (${!cursor} or (day,coalesce(offer_id,'00000000-0000-0000-0000-000000000000'::uuid))>
      (${cursor?.day as string ?? ""},${cursor?.offer_id as string ?? "00000000-0000-0000-0000-000000000000"}::uuid))
      order by day,coalesce(offer_id,'00000000-0000-0000-0000-000000000000'::uuid) limit 500`);
}
