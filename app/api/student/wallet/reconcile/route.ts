import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { reconcileGoogleWalletPasses } from "@/lib/wallet/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = z.string().min(1).safeParse(process.env.CRON_SECRET);
  if (!secret.success) return Response.json({ error: "Cron is not configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const expected = createHash("sha256").update(`Bearer ${secret.data}`).digest();
  const supplied = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  if (!timingSafeEqual(expected, supplied)) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    return Response.json(await reconcileGoogleWalletPasses(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Reconciliation failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
