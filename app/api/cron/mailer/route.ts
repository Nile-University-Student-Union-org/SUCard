import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { drainOutbox } from "@/lib/email/drain";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const secret = z.string().min(1).safeParse(process.env.CRON_SECRET);
  if (!secret.success) return Response.json({ error: "Cron is not configured" }, { status: 503 });
  const expected = createHash("sha256").update(`Bearer ${secret.data}`).digest();
  const supplied = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  if (!timingSafeEqual(expected, supplied)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await drainOutbox(100), { headers: { "Cache-Control": "no-store" } });
}
