import { z } from "zod";
import { lookupCard } from "@/lib/student/admin";
import { errorResponse, json, requireAdmin } from "@/lib/student/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const url = new URL(request.url);
    const input = z.union([z.object({ qr: z.string().min(1).max(2048), serial: z.undefined().optional() }),
      z.object({ serial: z.string().min(1).max(32), qr: z.undefined().optional() })]).parse({ qr: url.searchParams.get("qr") ?? undefined, serial: url.searchParams.get("serial") ?? undefined });
    return json(await lookupCard(input));
  } catch (error) { return errorResponse(error); }
}
