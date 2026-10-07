import { admin, body, failed, json } from "@/lib/qr-studio/http";
import { createStyle, listStyles } from "@/lib/qr-studio/service";
import { createStyleSchema } from "@/lib/qr-studio/validation";
export const runtime = "nodejs";
export async function GET(request: Request) { try { await admin(request); return json({ styles: await listStyles() }); } catch (e) { return failed(e); } }
export async function POST(request: Request) { try { const actor = await admin(request); const input = await body(request, createStyleSchema); return json({ style: await createStyle(input, actor.id) }, 201); } catch (e) { return failed(e); } }
