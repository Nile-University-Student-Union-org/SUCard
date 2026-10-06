import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
const env = z.object({ SEED_ADMIN_EMAIL: z.email(), SEED_ADMIN_PASSWORD: z.string().min(8), SEED_ADMIN_NAME: z.string().min(1) }).parse(process.env);
async function main() {
  const { auth } = await import("../lib/auth/server");
  const ctx = await auth.$context;
  const email = env.SEED_ADMIN_EMAIL.toLowerCase();
  if (await ctx.internalAdapter.findUserByEmail(email)) {
    console.log("Admin already exists; skipped.");
  } else {
    const hash = await ctx.password.hash(env.SEED_ADMIN_PASSWORD);
    const created = await ctx.internalAdapter.createUser({ email, name: env.SEED_ADMIN_NAME, emailVerified: true, role: "super_admin" }, { method: "email-password" });
    await ctx.internalAdapter.linkAccount({ userId: created.id, accountId: created.id, providerId: "credential", password: hash });
    console.log("Super admin created.");
  }
  const { pool } = await import("../lib/db");
  await pool.end();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
