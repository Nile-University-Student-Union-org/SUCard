import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, cardBatches } from "@/lib/db/schema";
import { admin, body, failed, json, uuid } from "@/lib/qr-studio/http";
import { getPublishedVersion, StudioError } from "@/lib/qr-studio/service";
export const runtime = "nodejs";
const schema = z.strictObject({ qrStyleVersionId: z.uuid().optional(), printStatus: z.enum(["draft", "sent_to_printer", "received", "distributing"]).optional(), printStatusNote: z.string().trim().max(500).optional() }).refine(v => v.qrStyleVersionId !== undefined || v.printStatus !== undefined || v.printStatusNote !== undefined);
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try {
  const actor = await admin(request), id = uuid((await params).id), input = await body(request, schema);
  const version = input.qrStyleVersionId ? await getPublishedVersion(input.qrStyleVersionId) : null;
  if (input.qrStyleVersionId && !version) throw new StudioError("Style version is not published", 409);
  const result = await db.transaction(async tx => {
    const [before] = await tx.select().from(cardBatches).where(eq(cardBatches.id, id)).for("update");
    if (!before) throw new StudioError("Batch not found", 404);
    if (input.qrStyleVersionId && before.printStatus !== "draft") throw new StudioError("Batch has already been sent to printer", 409);
    const next = input.printStatus;
    if (next && next !== before.printStatus) {
      const allowed: Record<typeof before.printStatus, string[]> = { draft: ["sent_to_printer"], sent_to_printer: ["received"], received: ["distributing"], distributing: [] };
      if (!allowed[before.printStatus].includes(next)) throw new StudioError("Invalid print status transition", 409);
    }
    const [after] = await tx.update(cardBatches).set({ ...(input.qrStyleVersionId ? { qrStyleVersionId: input.qrStyleVersionId } : {}), ...(next ? { printStatus: next, printStatusChangedAt: new Date() } : {}), ...(input.printStatusNote !== undefined ? { printStatusNote: input.printStatusNote } : {}) }).where(eq(cardBatches.id, id)).returning();
    await tx.insert(auditLog).values({ actorId: actor.id, action: "cards.batch_updated", entity: "card_batch", entityId: id, data: { before: { qrStyleVersionId: before.qrStyleVersionId, printStatus: before.printStatus, printStatusNote: before.printStatusNote }, after: { qrStyleVersionId: after.qrStyleVersionId, printStatus: after.printStatus, printStatusNote: after.printStatusNote } } });
    return after;
  });
  return json({ batch: { id: result.id, qrStyleVersionId: result.qrStyleVersionId, printStatus: result.printStatus, printStatusNote: result.printStatusNote, printStatusChangedAt: result.printStatusChangedAt?.toISOString() ?? null } });
} catch (e) { return failed(e); } }
