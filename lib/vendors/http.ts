import "server-only";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { VendorError } from "./service";
export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export function errorResponse(error: unknown) {
  if (error instanceof VendorError) return json({ error: error.message, code: error.code }, error.status);
  if (error instanceof ZodError) return json({ error: error.issues[0]?.message ?? "Invalid input" }, 400);
  if (error instanceof SyntaxError) return json({ error: "Invalid JSON" }, 400);
  if (error instanceof Error && error.message === "Invalid date range") return json({ error: error.message }, 400);
  console.error(error); return json({ error: "Internal server error" }, 500);
}
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> { let body: unknown; try { body = await request.json(); } catch { throw new SyntaxError("Invalid JSON"); } return schema.parse(body); }
export async function admin(request: Request) {
  const person = await getCurrentUser(request.headers);
  if (!person) return json({ error: "Unauthorized" }, 401);
  if (person.disabledAt || person.role !== "admin" && person.role !== "super_admin") return json({ error: "Forbidden" }, 403);
  return person;
}
export async function cashier(request: Request) {
  const person = await getCurrentUser(request.headers);
  if (!person) return json({ error: "Unauthorized" }, 401);
  if (person.disabledAt || person.role !== "cashier" || !person.vendorId || !person.branchId) return json({ error: "Forbidden" }, 403);
  const { getCashierFromRequest } = await import("@/lib/auth/guards");
  return (await getCashierFromRequest(request)) ?? json({ error: "Forbidden" }, 403);
}
