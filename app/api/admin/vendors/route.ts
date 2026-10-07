import { admin, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { createVendor, listVendors } from "@/lib/vendors/service";
import { vendorBody } from "@/lib/vendors/validation";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ vendors: await listVendors() }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { const actor = await admin(request); if (actor instanceof Response) return actor; try { return json({ vendor: await createVendor(await parseBody(request, vendorBody), actor.id) }, 201); } catch (error) { return errorResponse(error); } }
