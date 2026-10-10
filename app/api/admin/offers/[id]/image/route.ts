import { z } from "zod";
import { admin, errorResponse, json } from "@/lib/vendors/http";
import { changeOfferImage } from "@/lib/vendors/offer-image-service";
import { MAX_OFFER_IMAGE_BYTES } from "@/lib/vendors/offer-image";
import { VendorError } from "@/lib/vendors/service";
import { idSchema } from "@/lib/vendors/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function boundedFormData(request: Request) {
  if (!request.body) throw new VendorError(400, "Expected multipart upload with one file field");
  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_OFFER_IMAGE_BYTES + 100_000) throw new VendorError(413, "Image must be at most 2.5 MB");
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return new Request(request.url, { method: "PUT", headers: request.headers, body: new Uint8Array(Buffer.concat(chunks)) }).formData();
}

export async function PUT(request: Request, ctx: RouteContext<"/api/admin/offers/[id]/image">) {
  const actor = await admin(request);
  if (actor instanceof Response) return actor;
  try {
    const id = idSchema.parse((await ctx.params).id);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new VendorError(400, "Expected multipart upload with one file field");
    if (Number(request.headers.get("content-length") ?? 0) > MAX_OFFER_IMAGE_BYTES + 100_000) throw new VendorError(413, "Image must be at most 2.5 MB");
    const form = await boundedFormData(request);
    const file = z.instanceof(File).safeParse(form.get("file"));
    if (!file.success || [...form.keys()].some(key => key !== "file")) throw new VendorError(400, "Expected one file field");
    if (!file.data.size || file.data.size > MAX_OFFER_IMAGE_BYTES) throw new VendorError(413, "Image must be at most 2.5 MB");
    const image = await changeOfferImage(id, actor.id, { bytes: Buffer.from(await file.data.arrayBuffer()), mime: file.data.type });
    return json(image);
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/offers/[id]/image">) {
  const actor = await admin(request);
  if (actor instanceof Response) return actor;
  try {
    await changeOfferImage(idSchema.parse((await ctx.params).id), actor.id);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
