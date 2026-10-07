import { admin, errorResponse, parseBody } from "@/lib/vendors/http";
import { resetAccountPassword } from "@/lib/vendors/service";
import { idSchema, passwordBody } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request, ctx: RouteContext<"/api/admin/vendor-accounts/[id]/password">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { const { password } = await parseBody(request, passwordBody); await resetAccountPassword(idSchema.parse((await ctx.params).id), password, actor.id); return new Response(null, { status: 204 }); } catch (error) { return errorResponse(error); } }
