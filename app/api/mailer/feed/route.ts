import { claimEmail } from "@/lib/email/delivery";
import { authorizedMailer, renderFeed } from "@/lib/email/feed";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!authorizedMailer(request)) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const items = await claimEmail();
  return new Response(renderFeed(items), { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "no-store" } });
}
