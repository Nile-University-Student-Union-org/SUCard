import { z } from "zod";
import { errorResponse, json, parseBody, requireStudent } from "@/lib/student/http";
import { StudentError, switchToPhysical } from "@/lib/student/service";

export async function POST(request: Request) {
  const student = await requireStudent(request);
  if (student instanceof Response) return student;
  if (student.user.role !== "student") return errorResponse(new StudentError(403, "Student role required"));
  try {
    await parseBody(request, z.strictObject({ cardFlow: z.literal("physical") }));
    return json(await switchToPhysical(student.user.id));
  } catch (error) { return errorResponse(error); }
}
