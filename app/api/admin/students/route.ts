import { z } from "zod";
import { searchStudents } from "@/lib/student/admin";
import { errorResponse, json, requireAdmin } from "@/lib/student/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const url = new URL(request.url);
    const query = z.object({ q: z.string().max(200).default(""), cursor: z.string().optional() }).parse({
      q: url.searchParams.get("q") ?? "", cursor: url.searchParams.get("cursor") ?? undefined });
    return json(await searchStudents(query.q, query.cursor));
  } catch (error) { return errorResponse(error); }
}
