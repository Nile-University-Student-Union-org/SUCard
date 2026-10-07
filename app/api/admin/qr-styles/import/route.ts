import { admin, body, failed, json } from "@/lib/qr-studio/http";
import { createStyle } from "@/lib/qr-studio/service";
import { importStyleSchema } from "@/lib/qr-studio/validation";
export const runtime = "nodejs";
export async function POST(request: Request) { try { const actor = await admin(request); const input = await body(request, importStyleSchema); return json({ style: await createStyle({ name: input.name, config: input.config }, actor.id) }, 201); } catch (e) { return failed(e); } }
