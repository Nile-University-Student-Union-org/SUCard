import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { updateBranch } from "@/lib/vendors/service";
import { branchPatch, idSchema } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/branches/[id]">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ branch: await updateBranch(idSchema.parse((await ctx.params).id), await parseBody(request, branchPatch), actor.id) }); } catch (error) { return errorResponse(error); } }
