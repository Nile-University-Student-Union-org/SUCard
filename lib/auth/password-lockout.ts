import { createHash } from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authFailedAttempts } from "@/lib/db/schema";
import { LOCKOUT_WINDOW_MS, passwordLocked } from "./password-lockout-policy";

function emailHash(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
}

export async function isPasswordLocked(email: string): Promise<boolean> {
  const [row] = await db.select().from(authFailedAttempts).where(eq(authFailedAttempts.emailHash, emailHash(email)));
  return !!row && passwordLocked(row.count, row.lastFailedAt);
}

export async function recordPasswordFailure(email: string): Promise<void> {
  const now = new Date();
  await db.insert(authFailedAttempts).values({ emailHash: emailHash(email), count: 1, lastFailedAt: now })
    .onConflictDoUpdate({ target: authFailedAttempts.emailHash, set: {
      count: sql`case when ${authFailedAttempts.lastFailedAt} > ${new Date(now.getTime() - LOCKOUT_WINDOW_MS)} then ${authFailedAttempts.count} + 1 else 1 end`,
      lastFailedAt: now,
    } });
  await db.delete(authFailedAttempts).where(lt(authFailedAttempts.lastFailedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));
}

export async function clearPasswordFailures(email: string): Promise<void> {
  await db.delete(authFailedAttempts).where(eq(authFailedAttempts.emailHash, emailHash(email)));
}
