import { z } from "zod";
import { revokeStaffRole } from "@/lib/student/admin";
import { errorResponse, json, requireAdmin } from "@/lib/student/http";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin(request, true);
  if (actor instanceof Response) return actor;
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(await params);
    return json(await revokeStaffRole(id, actor.id));
  } catch (error) { return errorResponse(error); }
}
