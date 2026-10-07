import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { updateAccount } from "@/lib/vendors/service";
import { accountPatch, idSchema } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/vendor-accounts/[id]">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ account: await updateAccount(idSchema.parse((await ctx.params).id), await parseBody(request, accountPatch), actor.id) }); } catch (error) { return errorResponse(error); } }
