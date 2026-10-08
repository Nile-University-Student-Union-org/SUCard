import { createHash, timingSafeEqual } from "node:crypto";

export function validFeedKey(actual: string | null, expected: string | undefined): boolean {
  if (!actual || !expected || expected.length < 32) return false;
  const a = createHash("sha256").update(actual).digest(), b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
export function authorizedMailer(request: Request): boolean {
  const authorization = request.headers.get("authorization");
  const match = /^Bearer ([^\s]+)$/.exec(authorization ?? "");
  return validFeedKey(match?.[1] ?? null, process.env.MAILER_FEED_KEY);
}
export function xml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!); }
export function cdata(value: string) { return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`; }
export function renderFeed(items: { id: string; leaseId: string | null; to: string; subject: string; html: string; createdAt: Date }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:su="https://sucard.local/mail"><channel><title>SU Card mailer</title><description>Claimed transactional email</description><link>https://sucard.local</link>${items.map(item =>
    `<item><guid isPermaLink="false">${xml(item.id)}</guid><su:lease>${xml(item.leaseId ?? "")}</su:lease><title>${xml(item.subject)}</title><description>${cdata(item.html)}</description><author>${xml(item.to)}</author><category>${xml(item.to)}</category><pubDate>${item.createdAt.toUTCString()}</pubDate></item>`).join("")}</channel></rss>`;
}
