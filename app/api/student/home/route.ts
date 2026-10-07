import { requireStudent, errorResponse, json } from "@/lib/student/http";
import { getStudentHome } from "@/lib/student/service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const student = await requireStudent(request);
  if (student instanceof Response) return student;
  try { return json(await getStudentHome(student.user.id)); } catch (error) { return errorResponse(error); }
}
