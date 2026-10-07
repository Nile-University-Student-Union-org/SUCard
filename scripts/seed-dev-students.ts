import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
if (process.env.NODE_ENV === "production") throw new Error("Dev student seed refuses to run in production");

async function main() {
  const { db, pool } = await import("../lib/db");
  const { auth } = await import("../lib/auth/server");
  const { studentProfiles, cards } = await import("../lib/db/schema");
  const { generateToken } = await import("../lib/cards/token");
  const { desc, sql } = await import("drizzle-orm");
  const ctx = await auth.$context;
  const people = [
    { email: "s.one2300@sucard.local", name: "Test Student One", universityId: "231001001", flow: "digital", role: "student" },
    { email: "s.two2300@sucard.local", name: "Test Student Two", universityId: "231001002", flow: "physical", role: "student" },
    { email: "s.three2300@sucard.local", name: "Test Student Three", universityId: "231001003", flow: "physical", role: "student" },
    { email: "s.admin2300@sucard.local", name: "Test Student Admin", universityId: "231001004", flow: "digital", role: "admin" },
  ] as const;
  try {
    for (const person of people) {
      if (await ctx.internalAdapter.findUserByEmail(person.email)) { console.log(`${person.email}: exists; skipped`); continue; }
      const hash = await ctx.password.hash("studentpass123");
      const created = await ctx.internalAdapter.createUser({ email: person.email, name: person.name, role: person.role, emailVerified: true }, { method: "email-password" });
      await ctx.internalAdapter.linkAccount({ userId: created.id, accountId: created.id, providerId: "credential", password: hash });
      await db.transaction(async (tx) => {
        await tx.insert(studentProfiles).values({ userId: created.id, universityId: person.universityId, cardFlow: person.flow });
        if (person.flow === "digital") {
          await tx.execute(sql`select pg_advisory_xact_lock(7238101)`);
          const [last] = await tx.select({ serial: cards.serialNumber }).from(cards).orderBy(desc(cards.serialNumber)).limit(1);
          await tx.insert(cards).values({ type: "digital", serialNumber: (last?.serial ?? 0) + 1, token: generateToken(),
            status: "active", studentId: created.id, linkedAt: new Date() });
        }
      });
      console.log(`${person.email}: created`);
    }
  } finally { await pool.end(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
