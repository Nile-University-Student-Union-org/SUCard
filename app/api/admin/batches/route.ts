import { getAdminFromRequest } from "@/lib/auth/guards";
import { createBatch, listBatches } from "@/lib/cards/batches";
import { createBatchSchema } from "@/lib/cards/validation";
import { StudioError } from "@/lib/qr-studio/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  if (!await getAdminFromRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  return Response.json({ batches: await listBatches() }, { headers: noStore });
}
export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400, headers: noStore }); }
  const parsed = createBatchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid batch details" }, { status: 400, headers: noStore });
  try { return Response.json({ batch: await createBatch({ ...parsed.data, createdBy: admin.id }) }, { status: 201, headers: noStore }); }
  catch (error) { if (error instanceof StudioError) return Response.json({ error: error.message }, { status: error.status, headers: noStore }); throw error; }
}
