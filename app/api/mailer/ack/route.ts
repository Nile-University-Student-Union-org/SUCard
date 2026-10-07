import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { emailOutbox } from "@/lib/db/schema";
import { validFeedKey } from "@/lib/email/feed";
export async function POST(request: Request) {
  const parsed = z.strictObject({ key: z.string().min(32).max(256), ids: z.array(z.uuid()).min(1).max(100) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validFeedKey(parsed.data.key, process.env.MAILER_FEED_KEY)) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const rows = await db.update(emailOutbox).set({ status: "sent", sentAt: new Date(), attempts: 1 }).where(and(inArray(emailOutbox.id, parsed.data.ids), eq(emailOutbox.status, "queued"))).returning({ id: emailOutbox.id });
  return Response.json({ ids: rows.map(row => row.id) }, { headers: { "Cache-Control": "no-store" } });
}
