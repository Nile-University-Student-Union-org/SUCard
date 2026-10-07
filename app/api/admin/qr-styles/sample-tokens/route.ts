import { z } from "zod";
import { admin, failed, json } from "@/lib/qr-studio/http";
import { generateToken, buildQrPayload } from "@/lib/cards/token";
export const runtime = "nodejs";
export async function GET(request: Request) { try { await admin(request); const url = new URL(request.url); const parsed = z.coerce.number().int().min(1).max(32).safeParse(url.searchParams.get("count") ?? 8); if (!parsed.success) return json({ error: "Invalid count" }, 400); return json({ tokens: Array.from({ length: parsed.data }, () => buildQrPayload(generateToken())) }); } catch (e) { return failed(e); } }
