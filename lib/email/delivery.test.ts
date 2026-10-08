import { describe, expect, it } from "vitest";

const testDatabaseUrl = process.env.MAILER_TEST_DATABASE_URL;

describe.skipIf(!testDatabaseUrl)("mail delivery persistence", () => {
  it("claims once across pollers, retries a failure, and acknowledges each lease once", async () => {
    const databaseUrl = new URL(testDatabaseUrl!);
    if (!["localhost", "127.0.0.1"].includes(databaseUrl.hostname) || !databaseUrl.pathname.endsWith("_test"))
      throw new Error("Mailer delivery tests require a local test database");

    process.env.DATABASE_URL = testDatabaseUrl;
    const [{ db, pool }, { emailOutbox }, { claimEmail, acknowledgeEmail }, { eq }] = await Promise.all([
      import("@/lib/db"), import("@/lib/db/schema"), import("./delivery"), import("drizzle-orm"),
    ]);
    const resetLink = "https://example.com/reset-password?token=keep-this-token";
    const [message] = await db.insert(emailOutbox).values({
      to: "mailer-test@example.com", kind: "password_reset", subject: "Reset password",
      html: `<a href="${resetLink}">Reset</a>`, text: resetLink,
    }).returning({ id: emailOutbox.id });

    try {
      const polls = await Promise.all([claimEmail(), claimEmail()]);
      const firstClaims = polls.flat().filter((claim) => claim.id === message.id);
      expect(firstClaims).toHaveLength(1);
      const firstLease = firstClaims[0].leaseId!;
      expect(firstClaims[0].html).toContain(resetLink);

      expect(await acknowledgeEmail(message.id, firstLease, "failed")).toBe(true);
      expect(await acknowledgeEmail(message.id, firstLease, "failed")).toBe(true);
      expect((await claimEmail()).some((claim) => claim.id === message.id)).toBe(false);

      const [failed] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, message.id));
      expect(failed).toMatchObject({ status: "failed", attempts: 1, lastError: "delivery_failed" });
      expect(failed.html).toContain(resetLink);

      await db.update(emailOutbox).set({ leaseUntil: new Date(Date.now() - 1000) }).where(eq(emailOutbox.id, message.id));
      const retry = (await claimEmail()).find((claim) => claim.id === message.id)!;
      expect(retry.leaseId).not.toBe(firstLease);
      expect(retry.html).toContain(resetLink);
      expect(await acknowledgeEmail(message.id, firstLease, "sent")).toBe(false);
      expect(await acknowledgeEmail(message.id, retry.leaseId!, "sent")).toBe(true);
      expect(await acknowledgeEmail(message.id, retry.leaseId!, "sent")).toBe(true);

      const [sent] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, message.id));
      expect(sent).toMatchObject({ status: "sent", attempts: 2, lastError: null });
      expect(sent.sentAt).toBeInstanceOf(Date);
      expect((await claimEmail()).some((claim) => claim.id === message.id)).toBe(false);
    } finally {
      await db.delete(emailOutbox).where(eq(emailOutbox.id, message.id));
      await pool.end();
    }
  });
});
