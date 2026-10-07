import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOutbox } from "@/lib/db/schema";
import { renderFeed, validFeedKey } from "@/lib/email/feed";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const key = z.string().min(32).max(256).safeParse(new URL(request.url).searchParams.get("key"));
  if (!key.success || !validFeedKey(key.data, process.env.MAILER_FEED_KEY)) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const items = await db.select().from(emailOutbox).where(eq(emailOutbox.status, "queued")).orderBy(asc(emailOutbox.createdAt)).limit(100);
  return new Response(renderFeed(items), { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "no-store" } });
}
