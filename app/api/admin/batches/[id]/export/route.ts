import { Readable } from "node:stream";
import { z } from "zod";
import { getAdminFromRequest } from "@/lib/auth/guards";
import { auditBatchExport, getBatchWithCards } from "@/lib/cards/batches";
import { streamBatchZip } from "@/lib/cards/export";
import { parseExportOptions } from "@/lib/cards/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Invalid batch ID" }, { status: 400, headers: noStore });
  let options;
  try { options = parseExportOptions(new URL(request.url).searchParams); }
  catch { return Response.json({ error: "Invalid export options" }, { status: 400, headers: noStore }); }
  const batch = await getBatchWithCards(id);
  if (!batch) return Response.json({ error: "Batch not found" }, { status: 404, headers: noStore });
  await auditBatchExport(id, admin.id, options);
  const zip = streamBatchZip(batch, options);
  return new Response(Readable.toWeb(zip) as ReadableStream<Uint8Array>, { headers: {
    ...noStore, "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="nusu-cards-batch-${String(batch.batch.number).padStart(3, "0")}.zip"`,
  } });
}
