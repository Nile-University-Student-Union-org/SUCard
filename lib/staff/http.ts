import "server-only";
import { ZodError, type ZodType } from "zod";
import { getAdminFromRequest, type StaffUser } from "@/lib/auth/guards";
import { StaffError } from "./service";
import { logError } from "@/lib/log";

const noStore = { "Cache-Control": "no-store" };
export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: noStore });
}
export function errorResponse(error: unknown): Response {
  if (error instanceof StaffError) return json({ error: error.message }, error.status);
  if (error instanceof ZodError) return json({ error: error.issues[0]?.message ?? "Invalid input" }, 400);
  if (error instanceof SyntaxError) return json({ error: "Invalid JSON" }, 400);
  if (error instanceof Error && error.message === "Invalid audit cursor") return json({ error: error.message }, 400);
  logError("/api/admin/staff", error);
  return json({ error: "Internal server error" }, 500);
}
export async function superAdmin(request: Request): Promise<StaffUser | Response> {
  const admin = await getAdminFromRequest(request);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  if (admin.role !== "super_admin") return json({ error: "Forbidden" }, 403);
  return admin;
}
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try { body = await request.json(); } catch { throw new SyntaxError("Invalid JSON"); }
  return schema.parse(body);
}
