import { z } from "zod";
import { admin, json, errorResponse } from "@/lib/vendors/http";
import { revokeVendorSessions } from "@/lib/auth/revoke";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await admin(request); if (actor instanceof Response) return actor;
  try { return (await revokeVendorSessions(z.string().min(1).parse((await params).id), actor.id)) ? new Response(null, { status: 204 }) : json({ error: "Account not found" }, 404); }
  catch (error) { return errorResponse(error); }
}
