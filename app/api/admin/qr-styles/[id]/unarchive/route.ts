import { admin, failed, json, uuid } from "@/lib/qr-studio/http";
import { setArchived } from "@/lib/qr-studio/service";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await admin(request); await setArchived(uuid((await params).id), false, actor.id); return json({ ok: true }); } catch (e) { return failed(e); } }
