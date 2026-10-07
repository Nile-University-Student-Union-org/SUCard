import { z } from "zod";
import { getAdminFromRequest } from "@/lib/auth/guards";
import { StudioError } from "./service";
export const noStore = { "Cache-Control": "no-store" };
export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore });
export async function admin(request: Request) { const actor = await getAdminFromRequest(request); if (!actor) throw new StudioError("Unauthorized", 401); return actor; }
export async function body<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  let value: unknown; try { value = await request.json(); } catch { throw new StudioError("Invalid JSON", 400); }
  const parsed = schema.safeParse(value); if (!parsed.success) throw new StudioError("Invalid request", 400);
  return parsed.data;
}
export function uuid(id: string) { if (!z.uuid().safeParse(id).success) throw new StudioError("Invalid ID", 400); return id; }
export function failed(error: unknown) { if (error instanceof StudioError) return json({ error: error.message }, error.status); console.error(error); return json({ error: "Internal server error" }, 500); }
