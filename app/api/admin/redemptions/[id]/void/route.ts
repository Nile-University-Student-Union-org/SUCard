import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { voidRedemption } from "@/lib/vendors/service";
import { idSchema, voidBody } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request, ctx: RouteContext<"/api/admin/redemptions/[id]/void">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { const { reason } = await parseBody(request, voidBody); const row = await voidRedemption(idSchema.parse((await ctx.params).id), reason, actor.id); return json({ id: row.id, voided: row.voided, voidedAt: row.voidedAt?.toISOString(), voidReason: row.voidReason }); } catch (error) { return errorResponse(error); } }
