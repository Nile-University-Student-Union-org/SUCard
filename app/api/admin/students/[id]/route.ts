import { z } from "zod";
import { setStudentFlow } from "@/lib/student/admin";
import { errorResponse, json, parseBody, requireAdmin } from "@/lib/student/http";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(await params);
    const { cardFlow } = await parseBody(request, z.object({ cardFlow: z.enum(["digital", "physical"]) }).strict());
    return json(await setStudentFlow(id, cardFlow, actor.id));
  } catch (error) { return errorResponse(error); }
}
