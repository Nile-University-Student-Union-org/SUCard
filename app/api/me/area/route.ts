import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { getAreas } from "@/lib/student/service";
import { errorResponse, json, parseBody } from "@/lib/student/http";

export async function POST(request: Request) {
  const person = await getCurrentUser(request.headers);
  if (!person) return json({ error: "Unauthorized" }, 401);
  if (person.disabledAt) return json({ error: "Forbidden" }, 403);
  try {
    const { key } = await parseBody(request, z.object({ key: z.enum(["student", "admin", "scanner", "vendor"]) }).strict());
    const area = (await getAreas(person)).find((value) => value.key === key);
    if (!area) return json({ error: "Forbidden" }, 403);
    const response = NextResponse.json({ href: area.href }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set("sucard_area", key, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 24 * 60 * 60 });
    return response;
  } catch (error) { return errorResponse(error); }
}
