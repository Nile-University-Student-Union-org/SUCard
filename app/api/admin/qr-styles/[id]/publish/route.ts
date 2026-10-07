import { admin, body, failed, json, uuid } from "@/lib/qr-studio/http";
import { publishStyle } from "@/lib/qr-studio/service";
import { publishStyleSchema } from "@/lib/qr-studio/validation";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await admin(request); const input = await body(request, publishStyleSchema); return json({ version: await publishStyle(uuid((await params).id), input.acceptWarningsReason, actor.id) }, 201); } catch (e) { return failed(e); } }
