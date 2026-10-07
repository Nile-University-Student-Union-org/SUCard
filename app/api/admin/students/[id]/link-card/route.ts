import { z } from "zod";
import { adminLinkCard } from "@/lib/student/admin";
import { errorResponse, json, parseBody, requireAdmin } from "@/lib/student/http";
const input = z.union([z.object({ qr: z.string().min(1).max(2048) }).strict(),
  z.object({ serial: z.union([z.string().min(1).max(32), z.number().int().positive()]) }).strict()]);
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(await params);
    return json(await adminLinkCard(id, await parseBody(request, input), actor.id));
  } catch (error) { return errorResponse(error); }
}
