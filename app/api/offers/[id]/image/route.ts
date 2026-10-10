import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getAdminFromRequest } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { offerImages, offers, vendors } from "@/lib/db/schema";
import { cairoParts } from "@/lib/vendors/rules";
import { idSchema } from "@/lib/vendors/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: RouteContext<"/api/offers/[id]/image">) {
  const parsed = idSchema.safeParse((await ctx.params).id);
  if (!parsed.success) return Response.json({ error: "Invalid offer ID" }, { status: 400 });
  const version = z.string().max(128).nullable().safeParse(new URL(request.url).searchParams.get("v"));
  if (!version.success) return Response.json({ error: "Invalid image version" }, { status: 400 });
  const [row] = await db.select({ offer: offers, vendor: vendors, image: offerImages }).from(offers)
    .innerJoin(vendors, eq(offers.vendorId, vendors.id))
    .innerJoin(offerImages, eq(offerImages.offerId, offers.id))
    .where(and(eq(offers.id, parsed.data)));
  if (!row) return Response.json({ error: "Image not found" }, { status: 404 });
  const day = cairoParts(new Date()).day;
  const isPublic = row.offer.visible && row.offer.status === "active" && row.vendor.status === "active"
    && (!row.vendor.contractStart || row.vendor.contractStart <= day)
    && (!row.vendor.contractEnd || row.vendor.contractEnd >= day)
    && (!row.offer.startsAt || row.offer.startsAt <= day)
    && (!row.offer.endsAt || row.offer.endsAt >= day);
  if (!isPublic && !await getAdminFromRequest(request)) return Response.json({ error: "Image not found" }, { status: 404 });
  const immutable = isPublic && version.data === row.image.sha256.slice(0, 8);
  const headers = {
    "Content-Type": row.image.mime,
    "Content-Length": String(row.image.size),
    "Cache-Control": isPublic ? immutable ? "public, max-age=31536000, immutable" : "public, max-age=60" : "private, no-store",
    "ETag": `"${row.image.sha256}"`,
    "X-Content-Type-Options": "nosniff",
  };
  if (request.headers.get("if-none-match") === headers.ETag) return new Response(null, { status: 304, headers });
  return new Response(new Uint8Array(row.image.bytes), { headers });
}
