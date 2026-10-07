import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { createBranch, listBranches } from "@/lib/vendors/service";
import { branchBody, idSchema } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]/branches">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ branches: await listBranches(idSchema.parse((await ctx.params).id)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]/branches">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ branch: await createBranch(idSchema.parse((await ctx.params).id), await parseBody(request, branchBody), actor.id) }, 201); } catch (error) { return errorResponse(error); } }
