import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { account, studentProfiles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings/service";
import { matchesStudentEmail } from "@/lib/student/rules";
import { getAreas } from "@/lib/student/service";
import { json } from "@/lib/student/http";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const person = await getCurrentUser(request.headers);
  if (!person) return json({ error: "Unauthorized" }, 401);
  if (person.disabledAt) return json({ error: "Forbidden" }, 403);
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, person.id));
  const [microsoft] = await db.select({ id: account.id }).from(account).where(and(eq(account.userId, person.id), eq(account.providerId, "microsoft")));
  const studentStatus = profile?.status ?? (microsoft && matchesStudentEmail(person.email, (await getSettings()).studentEmailPattern) ? "needs_profile" : "none");
  return json({ name: person.name, email: person.email, areas: await getAreas(person), studentStatus, role: person.role });
}
