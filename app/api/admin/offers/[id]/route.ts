import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { getOffer, updateOffer } from "@/lib/vendors/service";
import { idSchema, offerPatch } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, ctx: RouteContext<"/api/admin/offers/[id]">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ offer: await getOffer(idSchema.parse((await ctx.params).id)) }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/offers/[id]">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ offer: await updateOffer(idSchema.parse((await ctx.params).id), await parseBody(request, offerPatch), actor.id) }); } catch (error) { return errorResponse(error); } }
