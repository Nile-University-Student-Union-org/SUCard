import { z } from "zod";
import { acknowledgeEmail } from "@/lib/email/delivery";
import { authorizedMailer } from "@/lib/email/feed";

const body = z.strictObject({
  items: z.array(z.strictObject({ id: z.uuid(), leaseId: z.uuid(), outcome: z.enum(["sent", "failed"]) })).min(1).max(100),
});

export async function POST(request: Request) {
  if (!authorizedMailer(request)) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid acknowledgement" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const acknowledgements = [];
  for (const item of parsed.data.items) {
    acknowledgements.push({ id: item.id, acknowledged: await acknowledgeEmail(item.id, item.leaseId, item.outcome) });
  }
  return Response.json({ results: acknowledgements }, { headers: { "Cache-Control": "no-store" } });
}
