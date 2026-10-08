import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { walletPasses } from "@/lib/db/schema";
import { syncGoogleWalletForStudent } from "./google";

// A bounded batch keeps each cron invocation within a serverless request. Updating
// lastAttemptedAt before the Google call rotates failed passes back into the queue.
export async function reconcileGoogleWalletPasses() {
  const passes = await db.select({ studentId: walletPasses.studentId }).from(walletPasses)
    .where(eq(walletPasses.platform, "google"))
    .orderBy(sql`${walletPasses.lastAttemptedAt} asc nulls first`, asc(walletPasses.studentId))
    .limit(10);
  const outcomes = await Promise.all(passes.map((pass) => syncGoogleWalletForStudent(pass.studentId)));
  return { attempted: outcomes.length, succeeded: outcomes.filter(Boolean).length, failed: outcomes.filter((ok) => !ok).length };
}
