import { listAudit } from "@/lib/staff/service";
import { auditQuerySchema } from "@/lib/staff/validation";
import { errorResponse, json, superAdmin } from "@/lib/staff/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await superAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const query = Object.fromEntries(new URL(request.url).searchParams);
    return json(await listAudit(auditQuerySchema.parse(query)));
  } catch (error) { return errorResponse(error); }
}
