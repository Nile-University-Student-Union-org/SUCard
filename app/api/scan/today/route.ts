import { cashier, errorResponse, json } from "@/lib/vendors/http";
import { today } from "@/lib/vendors/scan";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { const actor = await cashier(request); if (actor instanceof Response) return actor; try { return json(await today(actor)); } catch (error) { return errorResponse(error); } }
