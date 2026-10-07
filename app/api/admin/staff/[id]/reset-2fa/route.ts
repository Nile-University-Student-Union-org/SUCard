import { z } from "zod";
import { superAdmin, json, errorResponse } from "@/lib/staff/http";
import { resetAdminTwoFactor } from "@/lib/auth/revoke";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await superAdmin(request); if (actor instanceof Response) return actor;
  try { return (await resetAdminTwoFactor(z.string().min(1).parse((await params).id), actor.id)) ? new Response(null, { status: 204 }) : json({ error: "Admin not found" }, 404); }
  catch (error) { return errorResponse(error); }
}
