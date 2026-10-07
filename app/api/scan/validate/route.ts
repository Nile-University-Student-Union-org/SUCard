import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { scanEvents } from "@/lib/db/schema";
import { cashier, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { validateBody } from "@/lib/vendors/validation";
import { validateScan } from "@/lib/vendors/scan";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { const actor = await cashier(request); if (actor instanceof Response) return actor; try {
  const { qr } = await parseBody(request, validateBody);
  return await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${actor.person.id}), 60)`);
    const [recent] = await tx.select({ n: count() }).from(scanEvents).where(and(eq(scanEvents.cashierId, actor.person.id), gte(scanEvents.createdAt, new Date(Date.now() - 60000))));
    if (recent.n >= 60) {
      await tx.insert(scanEvents).values({ vendorId: actor.vendor.id, cashierId: actor.person.id, result: "rate_limited", reason: "Scan rate limit exceeded", deviceInfo: request.headers.get("user-agent")?.slice(0, 300) ?? null });
      return json({ error: "Scan rate limit exceeded" }, 429);
    }
    return json(await validateScan(actor, qr, request.headers.get("user-agent"), tx));
  });
} catch (error) { return errorResponse(error); } }

