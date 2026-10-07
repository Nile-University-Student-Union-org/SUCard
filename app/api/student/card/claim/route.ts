import { z } from "zod";
import { requireStudent, errorResponse, json, parseBody } from "@/lib/student/http";
import { claimCard } from "@/lib/student/service";
export async function POST(request: Request) {
  const student = await requireStudent(request);
  if (student instanceof Response) return student;
  try {
    const { qr } = await parseBody(request, z.object({ qr: z.string().max(2048) }).strict());
    return json(await claimCard(student.user.id, qr));
  } catch (error) { return errorResponse(error); }
}
