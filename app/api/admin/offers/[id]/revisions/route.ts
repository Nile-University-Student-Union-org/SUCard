import { admin, errorResponse, json } from "@/lib/vendors/http";
import { listRevisions } from "@/lib/vendors/service";
import { idSchema } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, ctx: RouteContext<"/api/admin/offers/[id]/revisions">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ revisions: await listRevisions(idSchema.parse((await ctx.params).id)) }); } catch (error) { return errorResponse(error); } }
