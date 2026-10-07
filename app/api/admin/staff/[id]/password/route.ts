import { resetStaffPassword } from "@/lib/staff/service";
import { staffIdSchema, resetStaffPasswordSchema } from "@/lib/staff/validation";
import { errorResponse, parseBody, superAdmin } from "@/lib/staff/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await superAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await context.params;
    const { password } = await parseBody(request, resetStaffPasswordSchema);
    await resetStaffPassword(staffIdSchema.parse(id), password, admin.id);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
