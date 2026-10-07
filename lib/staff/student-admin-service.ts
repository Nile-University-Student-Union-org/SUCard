import "server-only";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { auditLog, studentAdminGrants, studentProfiles, user } from "@/lib/db/schema";

const student = alias(user, "student_admin_student");
const granter = alias(user, "student_admin_granter");

export type StudentAdminGrant = {
  universityId: string;
  studentName: string | null;
  grantedBy: string | null;
  grantedByName: string | null;
  createdAt: string;
};

export async function lookupStudentAdminIds(ids: string[]) {
  const rows = await db.select({ universityId: studentProfiles.universityId, name: user.name })
    .from(studentProfiles).innerJoin(user, eq(user.id, studentProfiles.userId))
    .where(inArray(studentProfiles.universityId, ids));
  const names = new Map(rows.map((row) => [row.universityId, row.name]));
  return ids.map((universityId) => ({ universityId, studentName: names.get(universityId) ?? null }));
}

export async function listStudentAdminGrants(): Promise<StudentAdminGrant[]> {
  const rows = await db.select({ grant: studentAdminGrants, studentName: student.name, grantedByName: granter.name })
    .from(studentAdminGrants)
    .leftJoin(studentProfiles, eq(studentProfiles.universityId, studentAdminGrants.universityId))
    .leftJoin(student, eq(student.id, studentProfiles.userId))
    .leftJoin(granter, eq(granter.id, studentAdminGrants.grantedBy))
    .where(isNull(studentAdminGrants.revokedAt)).orderBy(asc(studentAdminGrants.universityId));
  return rows.map(({ grant, studentName, grantedByName }) => ({
    universityId: grant.universityId, studentName, grantedBy: grant.grantedBy,
    grantedByName, createdAt: grant.createdAt.toISOString(),
  }));
}

export async function grantStudentAdmins(ids: string[], actorId: string) {
  await db.transaction(async (tx) => {
    for (const universityId of ids) {
      await tx.execute(sql`select pg_advisory_xact_lock(7238110, hashtext(${universityId}))`);
      const [existing] = await tx.select().from(studentAdminGrants)
        .where(eq(studentAdminGrants.universityId, universityId));
      if (existing && !existing.revokedAt) continue;
      if (existing) await tx.update(studentAdminGrants).set({ grantedBy: actorId, createdAt: new Date(), revokedAt: null })
        .where(eq(studentAdminGrants.universityId, universityId));
      else await tx.insert(studentAdminGrants).values({ universityId, grantedBy: actorId });
      await tx.insert(auditLog).values({ actorId, action: "student_admin.granted", entity: "student_admin_grant",
        entityId: universityId, data: { universityId } });
    }
  });
  return listStudentAdminGrants();
}

export async function revokeStudentAdmin(universityId: string, actorId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(studentAdminGrants).set({ revokedAt: new Date() })
      .where(and(eq(studentAdminGrants.universityId, universityId), isNull(studentAdminGrants.revokedAt)))
      .returning({ universityId: studentAdminGrants.universityId });
    if (!updated) return false;
    await tx.insert(auditLog).values({ actorId, action: "student_admin.revoked", entity: "student_admin_grant",
      entityId: universityId, data: { universityId } });
    return true;
  });
}
