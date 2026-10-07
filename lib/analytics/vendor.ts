import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account,auditLog,session,user } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { VendorError } from "@/lib/vendors/service";
import { canManageCashier } from "./rules";
export async function updateCashier(vendorId:string,id:string,patch:{name?:string;status?:"active"|"disabled"},actorId:string){
  return db.transaction(async tx=>{
    const [before]=await tx.select().from(user).where(eq(user.id,id)).for("update");
    if(!before||!canManageCashier(vendorId,before)) throw new VendorError(404,"Cashier not found");
    const [after]=await tx.update(user).set({name:patch.name??before.name,disabledAt:patch.status===undefined?before.disabledAt:patch.status==="disabled"?new Date():null,updatedAt:new Date()}).where(eq(user.id,id)).returning();
    if(after.disabledAt) await tx.delete(session).where(eq(session.userId,id));
    await tx.insert(auditLog).values({actorId,action:"vendor_accounts.updated",entity:"user",entityId:id,data:{before:{name:before.name,status:before.disabledAt?"disabled":"active"},after:{name:after.name,status:after.disabledAt?"disabled":"active"}}});
    return {id:after.id,email:after.email,name:after.name,status:after.disabledAt?"disabled":"active"};
  });
}
export async function resetCashierPassword(vendorId:string,id:string,password:string,actorId:string){
  const hash=await (await auth.$context).password.hash(password);
  await db.transaction(async tx=>{
    const [person]=await tx.select().from(user).where(eq(user.id,id)).for("update");
    if(!person||!canManageCashier(vendorId,person)) throw new VendorError(404,"Cashier not found");
    const [credential]=await tx.select({id:account.id}).from(account).where(and(eq(account.userId,id),eq(account.providerId,"credential")));
    if(!credential) throw new VendorError(404,"Credential not found");
    await tx.update(account).set({password:hash,updatedAt:new Date()}).where(eq(account.id,credential.id));
    await tx.delete(session).where(eq(session.userId,id));
    await tx.insert(auditLog).values({actorId,action:"vendor_accounts.password_reset",entity:"user",entityId:id,data:{}});
  });
}
