import { z } from "zod";
import { voidCard } from "@/lib/student/admin";
import { errorResponse, json, parseBody, requireAdmin } from "@/lib/student/http";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const { id } = z.object({ id: z.uuid() }).parse(await params);
    const { reason } = await parseBody(request, z.object({ reason: z.string().trim().min(1).max(500) }).strict());
    return json(await voidCard(id, reason, actor.id));
  } catch (error) { return errorResponse(error); }
}
