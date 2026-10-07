import { updateStaff } from "@/lib/staff/service";
import { staffIdSchema, updateStaffSchema } from "@/lib/staff/validation";
import { errorResponse, json, parseBody, superAdmin } from "@/lib/staff/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await superAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await context.params;
    return json({ staff: await updateStaff(staffIdSchema.parse(id), await parseBody(request, updateStaffSchema), admin.id) });
  } catch (error) { return errorResponse(error); }
}
