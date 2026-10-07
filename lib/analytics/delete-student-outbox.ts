import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOutbox } from "@/lib/db/schema";

export async function deleteStudentOutbox(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], email: string): Promise<void> {
  await tx.delete(emailOutbox).where(sql`lower(${emailOutbox.to}) = lower(${email})`);
}
