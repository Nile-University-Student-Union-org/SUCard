import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";

config({ path: ".env.local", quiet: true });

describe("student outbox deletion", () => {
  it.skipIf(!process.env.DATABASE_URL)("removes all recipient casing variants and keeps other recipients", async () => {
    const { db, pool } = await import("@/lib/db");
    const { emailOutbox } = await import("@/lib/db/schema");
    const { deleteStudentOutbox } = await import("./delete-student-outbox");
    const email = `${randomUUID()}@example.test`;
    const other = `${randomUUID()}@example.test`;
    const rows = await db.insert(emailOutbox).values([email, email.toUpperCase(), other].map(to => ({ to, subject: "test", html: "", text: "", kind: "test" }))).returning({ id: emailOutbox.id });
    try {
      await db.transaction(tx => deleteStudentOutbox(tx, email));
      const remaining = await db.select({ to: emailOutbox.to }).from(emailOutbox).where(inArray(emailOutbox.id, rows.map(row => row.id)));
      expect(remaining.filter(row => row.to.toLowerCase() === email)).toEqual([]);
      expect(remaining.some(row => row.to === other)).toBe(true);
    } finally {
      for (const row of rows) await db.delete(emailOutbox).where(eq(emailOutbox.id, row.id));
      await pool.end();
    }
  });
});
