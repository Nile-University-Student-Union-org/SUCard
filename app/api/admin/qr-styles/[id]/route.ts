import { admin, body, failed, json, uuid } from "@/lib/qr-studio/http";
import { getStyle, updateStyle } from "@/lib/qr-studio/service";
import { updateStyleSchema } from "@/lib/qr-studio/validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) { try { await admin(request); const style = await getStyle(uuid((await context.params).id)); return style ? json({ style }) : json({ error: "Style not found" }, 404); } catch (e) { return failed(e); } }
export async function PATCH(request: Request, context: Context) { try { const actor = await admin(request); const id = uuid((await context.params).id); const input = await body(request, updateStyleSchema); return json({ style: await updateStyle(id, input, actor.id) }); } catch (e) { return failed(e); } }
