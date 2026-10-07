import { createStaff, listStaff } from "@/lib/staff/service";
import { createStaffSchema } from "@/lib/staff/validation";
import { errorResponse, json, parseBody, superAdmin } from "@/lib/staff/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await superAdmin(request);
  if (admin instanceof Response) return admin;
  try { return json({ staff: await listStaff(admin.id) }); } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  const admin = await superAdmin(request);
  if (admin instanceof Response) return admin;
  try { return json({ staff: await createStaff(await parseBody(request, createStaffSchema), admin.id) }, 201); }
  catch (error) { return errorResponse(error); }
}
