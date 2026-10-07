import { admin, errorResponse, json } from "@/lib/vendors/http";
import { setLogo, VendorError } from "@/lib/vendors/service";
import { idSchema } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]/logo">) { const actor = await admin(request); if (actor instanceof Response) return actor; try {
  const id = idSchema.parse((await ctx.params).id);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new VendorError(400, "Expected multipart upload");
  if (Number(request.headers.get("content-length") ?? 0) > 600000) throw new VendorError(413, "Logo too large");
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File) || [...form.keys()].some((key) => key !== "file")) throw new VendorError(400, "Expected one file field");
  if (file.size > 512 * 1024 || file.size === 0) throw new VendorError(413, "Logo must be at most 512 KB");
  const bytes = Buffer.from(await file.arrayBuffer()); const mime = file.type;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!(mime === "image/png" && png || mime === "image/jpeg" && jpeg || mime === "image/webp" && webp)) throw new VendorError(400, "Invalid image format");
  return json({ vendor: await setLogo(id, bytes, mime, actor.id) });
} catch (error) { return errorResponse(error); } }
