import { and, asc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOutbox } from "@/lib/db/schema";

export async function claimEmail() {
  const due = db.select({ id: emailOutbox.id }).from(emailOutbox)
    .where(or(
      eq(emailOutbox.status, "queued"),
      and(inArray(emailOutbox.status, ["failed", "leased"]), lt(emailOutbox.leaseUntil, new Date())),
    ))
    .orderBy(asc(emailOutbox.createdAt)).limit(100).for("update", { skipLocked: true });

  return db.update(emailOutbox).set({
    status: "leased",
    leaseId: sql`gen_random_uuid()`,
    leaseUntil: sql`now() + interval '15 minutes'`,
    attempts: sql`${emailOutbox.attempts} + 1`,
    lastError: sql`case when ${emailOutbox.status} = 'leased' then 'lease_expired' else ${emailOutbox.lastError} end`,
  }).where(inArray(emailOutbox.id, due)).returning({
    id: emailOutbox.id, leaseId: emailOutbox.leaseId, to: emailOutbox.to,
    subject: emailOutbox.subject, html: emailOutbox.html, createdAt: emailOutbox.createdAt,
  });
}

export async function acknowledgeEmail(id: string, leaseId: string, outcome: "sent" | "failed") {
  const [updated] = await db.update(emailOutbox).set({
    status: outcome,
    ...(outcome === "sent"
      ? { sentAt: new Date(), leaseUntil: null, lastError: null }
      : { leaseUntil: sql`now() + interval '5 minutes'`, lastError: "delivery_failed" }),
  }).where(and(eq(emailOutbox.id, id), eq(emailOutbox.leaseId, leaseId), eq(emailOutbox.status, "leased")))
    .returning({ id: emailOutbox.id });
  if (updated) return true;

  const [existing] = await db.select({ id: emailOutbox.id }).from(emailOutbox)
    .where(and(eq(emailOutbox.id, id), eq(emailOutbox.leaseId, leaseId), eq(emailOutbox.status, outcome)));
  return Boolean(existing);
}
