import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getAreas } from "@/lib/student/service";
import { goDestination } from "@/lib/student/rules";
import { account, studentProfiles } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings/service";
import { matchesStudentEmail } from "@/lib/student/rules";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const person = await getCurrentUser(request.headers);
  let destination = "/login";
  if (person?.disabledAt) destination = "/login?error=disabled";
  else if (person) {
    const areas = await getAreas(person);
    const [profile] = await db.select({ id: studentProfiles.userId }).from(studentProfiles).where(eq(studentProfiles.userId, person.id));
    const [microsoft] = await db.select({ id: account.id }).from(account).where(and(eq(account.userId, person.id), eq(account.providerId, "microsoft")));
    const needsProfile = !profile && !!microsoft && matchesStudentEmail(person.email, (await getSettings()).studentEmailPattern);
    const preferred = /(?:^|;\s*)sucard_area=(student|admin)(?:;|$)/.exec(request.headers.get("cookie") ?? "")?.[1];
    destination = goDestination(areas, needsProfile, preferred);
  }
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
