import { admin, body, failed, json, uuid } from "@/lib/qr-studio/http";
import { setDefault } from "@/lib/qr-studio/service";
import { defaultStyleSchema } from "@/lib/qr-studio/validation";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await admin(request); const input = await body(request, defaultStyleSchema); await setDefault(uuid((await params).id), input.target, actor.id); return json({ ok: true }); } catch (e) { return failed(e); } }
