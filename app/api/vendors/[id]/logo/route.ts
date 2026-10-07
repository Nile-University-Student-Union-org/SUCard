import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendorLogos, vendors } from "@/lib/db/schema";
import { idSchema } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, ctx: RouteContext<"/api/vendors/[id]/logo">) { const parsed = idSchema.safeParse((await ctx.params).id); if (!parsed.success) return Response.json({ error: "Invalid vendor ID" }, { status: 400 });
  const [row] = await db.select({ logo: vendorLogos }).from(vendors).innerJoin(vendorLogos, eq(vendors.logoId, vendorLogos.id)).where(eq(vendors.id, parsed.data));
  if (!row) return Response.json({ error: "Logo not found" }, { status: 404 });
  const etag = `"${row.logo.sha256}"`; const headers = { "Content-Type": row.logo.mime, "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400", ETag: etag, "X-Content-Type-Options": "nosniff" };
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(new Uint8Array(row.logo.data), { headers });
}
