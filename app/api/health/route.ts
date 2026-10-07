import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { healthPayload } from "@/lib/health";
export const dynamic = "force-dynamic";
export async function GET() {
  let dbOk = false;
  try { await db.execute(sql`select 1`); dbOk = true; } catch (error) { logError("/api/health", error); }
  return Response.json(healthPayload(dbOk),
    { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
