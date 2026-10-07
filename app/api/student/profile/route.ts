import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { completeProfile } from "@/lib/student/service";
import { errorResponse, json, parseBody } from "@/lib/student/http";
import { UNIVERSITY_ID_REGEX } from "@/lib/student/types";

export async function POST(request: Request) {
  const person = await getCurrentUser(request.headers);
  if (!person) return json({ error: "Unauthorized" }, 401);
  if (person.disabledAt) return json({ error: "Forbidden" }, 403);
  try {
    const { universityId } = await parseBody(request, z.object({ universityId: z.string().regex(UNIVERSITY_ID_REGEX) }).strict());
    return json(await completeProfile(person.id, universityId), 201);
  } catch (error) { return errorResponse(error); }
}
