import "server-only";
import { ZodError, type ZodType } from "zod";
import { getAdminFromRequest, getCurrentUser } from "@/lib/auth/guards";
import { VendorError } from "./service";
import { logError } from "@/lib/log";
export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export function errorResponse(error: unknown) {
  if (error instanceof VendorError) return json({ error: error.message, code: error.code }, error.status);
  if (error instanceof ZodError) return json({ error: error.issues[0]?.message ?? "Invalid input" }, 400);
  if (error instanceof SyntaxError) return json({ error: "Invalid JSON" }, 400);
  if (error instanceof Error && error.message === "Invalid date range") return json({ error: error.message }, 400);
  logError("/api/vendors", error); return json({ error: "Internal server error" }, 500);
}
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> { let body: unknown; try { body = await request.json(); } catch { throw new SyntaxError("Invalid JSON"); } return schema.parse(body); }
export async function admin(request: Request) {
  return (await getAdminFromRequest(request)) ?? json({ error: "Unauthorized" }, 401);
}
export async function cashier(request: Request) {
  const person = await getCurrentUser(request.headers);
  if (!person) return json({ error: "Unauthorized" }, 401);
  if (person.disabledAt || person.role !== "cashier" || !person.vendorId) return json({ error: "Forbidden" }, 403);
  const { getCashierFromRequest } = await import("@/lib/auth/guards");
  return (await getCashierFromRequest(request)) ?? json({ error: "Forbidden" }, 403);
}
