import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentAdminGrants, studentProfiles } from "@/lib/db/schema";

export async function hasStudentAdminGrant(userId: string): Promise<boolean> {
  const [grant] = await db.select({ universityId: studentAdminGrants.universityId })
    .from(studentProfiles)
    .innerJoin(studentAdminGrants, eq(studentAdminGrants.universityId, studentProfiles.universityId))
    .where(and(eq(studentProfiles.userId, userId), isNull(studentAdminGrants.revokedAt)));
  return !!grant;
}
