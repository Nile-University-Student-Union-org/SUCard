import { eq, inArray, sql } from "drizzle-orm";
import { getAdminFromRequest } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { emailOutbox, mailerCredentials } from "@/lib/db/schema";
import { mailerTokenKey } from "@/lib/email/credentials";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response(null, { status: 401 });
  if (admin.role !== "super_admin") return new Response(null, { status: 403 });
  const [[credential], [queue]] = await Promise.all([
    db.select({ accountEmail: mailerCredentials.accountEmail, status: mailerCredentials.status,
      lastError: mailerCredentials.lastError }).from(mailerCredentials).where(eq(mailerCredentials.id, "graph")),
    db.select({ count: sql<number>`count(*)::int` }).from(emailOutbox).where(inArray(emailOutbox.status, ["queued", "failed", "leased"])),
  ]);
  return Response.json({ status: credential?.status ?? "disconnected", accountEmail: credential?.accountEmail ?? null,
    lastError: credential?.lastError ?? null, queuedCount: queue.count, configured: Boolean(mailerTokenKey()) },
    { headers: { "Cache-Control": "no-store" } });
}
