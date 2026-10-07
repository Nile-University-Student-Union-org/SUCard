import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { createOffer, listOffers } from "@/lib/vendors/service";
import { idSchema, offerBody } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]/offers">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ offers: await listOffers(idSchema.parse((await ctx.params).id)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]/offers">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ offer: await createOffer(idSchema.parse((await ctx.params).id), await parseBody(request, offerBody), actor.id) }, 201); } catch (error) { return errorResponse(error); } }
