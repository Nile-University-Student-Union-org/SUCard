import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { getVendor, updateVendor } from "@/lib/vendors/service";
import { idSchema, vendorPatch } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ vendor: await getVendor(idSchema.parse((await ctx.params).id)) }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ vendor: await updateVendor(idSchema.parse((await ctx.params).id), await parseBody(request, vendorPatch), actor.id) }); } catch (error) { return errorResponse(error); } }
