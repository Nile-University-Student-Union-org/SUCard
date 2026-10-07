import { switchAllPendingToDigital } from "@/lib/student/admin";
import { errorResponse, json, requireAdmin } from "@/lib/student/http";
export async function POST(request: Request) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try { return json(await switchAllPendingToDigital(actor.id)); } catch (error) { return errorResponse(error); }
}
