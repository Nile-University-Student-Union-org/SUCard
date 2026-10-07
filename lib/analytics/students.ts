import "server-only";
import { createHash } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, cards, emailOutbox, scanEvents, studentProfiles, user } from "@/lib/db/schema";
import { getSettings } from "@/lib/settings/service";
import { emailTemplate } from "@/lib/email/templates";
import { StudentError } from "@/lib/student/service";
import { syncGoogleWalletForStudent } from "@/lib/wallet/google";
import { deleteStudentOutbox } from "./delete-student-outbox";

export async function correctStudent(id:string, patch:{name?:string;universityId?:string},actorId:string){
  await db.transaction(async tx=>{
    const [row]=await tx.select({u:user,p:studentProfiles}).from(user).innerJoin(studentProfiles,eq(user.id,studentProfiles.userId)).where(eq(user.id,id)).for("update");
    if(!row) throw new StudentError(404,"Student not found");
    if(patch.universityId && patch.universityId!==row.p.universityId){const [other]=await tx.select({id:studentProfiles.userId}).from(studentProfiles).where(eq(studentProfiles.universityId,patch.universityId));if(other) throw new StudentError(409,"University ID already used");}
    if(patch.name!==undefined) await tx.update(user).set({name:patch.name,updatedAt:new Date()}).where(eq(user.id,id));
    if(patch.universityId!==undefined) await tx.update(studentProfiles).set({universityId:patch.universityId}).where(eq(studentProfiles.userId,id));
    await tx.insert(auditLog).values({actorId,action:"students.corrected",entity:"student",entityId:id,data:{before:{name:row.u.name,universityId:row.p.universityId},after:{name:patch.name??row.u.name,universityId:patch.universityId??row.p.universityId}}});
  });
  await syncGoogleWalletForStudent(id);
}
export async function setStudentSuspension(ids:string[], action:"suspend"|"reactivate", reason:string|null, actorId:string){
  const changed=await db.transaction(async tx=>{
    const emailOnSuspend = action === "suspend" && (await getSettings(tx as unknown as typeof db)).emailOnSuspend;
    const records=await tx.select({id:studentProfiles.userId,status:studentProfiles.status,suspendReason:studentProfiles.suspendReason}).from(studentProfiles).where(inArray(studentProfiles.userId,ids)).for("update");
    if(records.length!==ids.length) throw new StudentError(404,"Student not found");
    const next=action==="suspend"?"suspended":"active";
    for(const p of records){
      await tx.update(studentProfiles).set({status:next,suspendReason:action==="suspend"?reason:null}).where(eq(studentProfiles.userId,p.id));
      await tx.insert(auditLog).values({actorId,action:`students.${action}ed`,entity:"student",entityId:p.id,data:{before:{status:p.status,reason:p.suspendReason},after:{status:next,reason:action==="suspend"?reason:null}}});
      if (emailOnSuspend && p.status !== "suspended") {
        const [person] = await tx.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, p.id));
        if (person) await tx.insert(emailOutbox).values({ to: person.email, kind: "card_suspended", ...emailTemplate("card_suspended", person.name) });
      }
    }
    return records.map(r=>r.id);
  });
  await Promise.all(changed.map(id=>syncGoogleWalletForStudent(id)));
  return {count:changed.length};
}
export async function deleteStudent(id:string,confirmEmail:string,actorId:string){
  const emailHash=await db.transaction(async tx=>{
    const [person]=await tx.select().from(user).where(eq(user.id,id)).for("update");
    if(!person || !(await tx.select({id:studentProfiles.userId}).from(studentProfiles).where(eq(studentProfiles.userId,id))).length) throw new StudentError(404,"Student not found");
    if(person.role!=="student") throw new StudentError(409,"Revoke staff role first");
    if(person.email!==confirmEmail) throw new StudentError(400,"Email confirmation does not match");
    const hash=createHash("sha256").update(person.email).digest("hex");
    await tx.update(cards).set({status:"void",voidReason:"student_deleted",voidedAt:new Date(),voidedBy:actorId,studentId:null}).where(eq(cards.studentId,id));
    await tx.update(scanEvents).set({studentId:null,studentDeleted:true}).where(eq(scanEvents.studentId,id));
    await deleteStudentOutbox(tx, person.email);
    await tx.execute(sql`update audit_log set entity_id=${hash}, data='{"redacted":true}'::jsonb
      where entity_id=${id} or data::text like ${`%${id}%`} or data::text like ${`%${person.email}%`}`);
    await tx.delete(user).where(eq(user.id,id));
    await tx.insert(auditLog).values({actorId,action:"students.deleted",entity:"student",entityId:hash,data:{emailHash:hash}});
    return hash;
  });
  // The Google object is addressed by student ID; sync after commit must mark it inactive.
  await syncGoogleWalletForStudent(id);
  return {deleted:true,emailHash};
}
