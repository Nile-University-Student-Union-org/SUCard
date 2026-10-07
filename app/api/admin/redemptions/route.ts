import { admin, errorResponse, json } from "@/lib/vendors/http";
import { listRedemptions } from "@/lib/vendors/service";
import { redemptionQuery } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { const actor = await admin(request); if (actor instanceof Response) return actor; try { const url = new URL(request.url); const q = redemptionQuery.parse(Object.fromEntries(url.searchParams)); return json(await listRedemptions(q)); } catch (error) { return errorResponse(error); } }
