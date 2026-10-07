import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { createAccount, listAccounts } from "@/lib/vendors/service";
import { accountBody, idSchema } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]/accounts">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ accounts: await listAccounts(idSchema.parse((await ctx.params).id)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request, ctx: RouteContext<"/api/admin/vendors/[id]/accounts">) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ account: await createAccount(idSchema.parse((await ctx.params).id), await parseBody(request, accountBody), actor.id) }, 201); } catch (error) { return errorResponse(error); } }
