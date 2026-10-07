import { getSettingsWithStats, settingsPatchSchema, updateSettings } from "@/lib/settings/service";
import { errorResponse, json, parseBody, requireAdmin } from "@/lib/student/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try { return json(await getSettingsWithStats()); } catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try { await updateSettings(await parseBody(request, settingsPatchSchema), actor.id); return json(await getSettingsWithStats()); }
  catch (error) { return errorResponse(error); }
}
