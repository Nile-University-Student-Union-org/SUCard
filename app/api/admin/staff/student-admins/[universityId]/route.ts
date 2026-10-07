import { errorResponse, json, superAdmin } from "@/lib/staff/http";
import { revokeStudentAdmin } from "@/lib/staff/student-admin-service";
import { universityIdSchema } from "@/lib/staff/student-admin-validation";

export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ universityId: string }> }) {
  const actor = await superAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const { universityId } = await context.params;
    const revoked = await revokeStudentAdmin(universityIdSchema.parse(universityId), actor.id);
    return revoked ? json({ revoked: true }) : json({ error: "Active grant not found" }, 404);
  } catch (error) { return errorResponse(error); }
}
