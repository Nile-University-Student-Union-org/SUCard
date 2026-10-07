import { admin, failed, json, uuid } from "@/lib/qr-studio/http";
import { getVersion } from "@/lib/qr-studio/service";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ versionId: string }> }) { try { await admin(request); const version = await getVersion(uuid((await params).versionId)); return version ? json({ version }) : json({ error: "Version not found" }, 404); } catch (e) { return failed(e); } }
