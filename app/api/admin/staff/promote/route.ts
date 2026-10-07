import { z } from "zod";
import { promoteStudent } from "@/lib/student/admin";
import { errorResponse, json, parseBody, requireAdmin } from "@/lib/student/http";
export async function POST(request: Request) {
  const actor = await requireAdmin(request, true);
  if (actor instanceof Response) return actor;
  try {
    const { email } = await parseBody(request, z.object({ email: z.email().transform((value) => value.toLowerCase()) }).strict());
    return json(await promoteStudent(email, actor.id));
  } catch (error) { return errorResponse(error); }
}
