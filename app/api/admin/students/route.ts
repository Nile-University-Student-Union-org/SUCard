import { searchStudents } from "@/lib/student/admin";
import { errorResponse, json, requireAdmin } from "@/lib/student/http";
import { studentQuerySchema, parseQuery } from "@/lib/analytics/rules";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const query = parseQuery(request, studentQuerySchema);
    return json(await searchStudents(query.q, query.cursor, query));
  } catch (error) { return errorResponse(error); }
}
