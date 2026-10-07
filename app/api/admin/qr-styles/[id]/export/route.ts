import { admin, failed, uuid } from "@/lib/qr-studio/http";
import { getStyle } from "@/lib/qr-studio/service";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await admin(request); const style = await getStyle(uuid((await params).id)); if (!style) return Response.json({ error: "Style not found" }, { status: 404 }); return new Response(JSON.stringify({ schemaVersion: 1, name: style.name, config: style.draftConfig }), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="qr-style-${style.id}.json"`, "Cache-Control": "no-store" } }); } catch (e) { return failed(e); } }
