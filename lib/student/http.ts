import "server-only";
import { ZodError, type ZodType } from "zod";
import { getAdminFromRequest, getCurrentUser, getStudentFromRequest } from "@/lib/auth/guards";
import { StudentError } from "./service";

export const noStore = { "Cache-Control": "no-store" };
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: noStore }); }
export function errorResponse(error: unknown): Response {
  if (error instanceof StudentError) return json({ error: error.message, ...(error.code ? { code: error.code } : {}) }, error.status);
  if (error instanceof ZodError) return json({ error: error.issues[0]?.message ?? "Invalid input" }, 400);
  if (error instanceof SyntaxError) return json({ error: "Invalid JSON" }, 400);
  if (error instanceof Error && (error.message === "Invalid date range" || error.message === "Invalid cursor")) return json({ error: error.message }, 400);
  if (error instanceof Error && error.message === "Vendor not found") return json({ error: error.message }, 404);
  console.error(error);
  return json({ error: "Internal server error" }, 500);
}
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let input: unknown;
  try { input = await request.json(); } catch { throw new SyntaxError("Invalid JSON"); }
  return schema.parse(input);
}
export async function requireAdmin(request: Request, superOnly = false) {
  const person = await getCurrentUser(request.headers);
  if (!person) return json({ error: "Unauthorized" }, 401);
  const admin = await getAdminFromRequest(request);
  if (!admin || superOnly && admin.role !== "super_admin") return json({ error: "Forbidden" }, 403);
  return admin;
}
export async function requireStudent(request: Request) {
  const person = await getCurrentUser(request.headers);
  if (!person) return json({ error: "Unauthorized" }, 401);
  const student = await getStudentFromRequest(request);
  if (!student) return json({ error: "Forbidden" }, 403);
  return student;
}
