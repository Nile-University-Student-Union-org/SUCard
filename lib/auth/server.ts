import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { STAFF_PASSWORD_MIN, STAFF_PASSWORD_MAX } from "@/lib/staff/types";

export const auth = betterAuth({
  secret: z.string().min(32).parse(process.env.BETTER_AUTH_SECRET),
  baseURL: z.url().parse(process.env.BETTER_AUTH_URL),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: STAFF_PASSWORD_MIN, maxPasswordLength: STAFF_PASSWORD_MAX },
  rateLimit: { enabled: true, storage: "memory", customRules: { "/sign-in/email": { window: 60, max: 5 } } },
  databaseHooks: { session: { create: { before: async (session) => {
    const [account] = await db.select({ disabledAt: schema.user.disabledAt }).from(schema.user).where(eq(schema.user.id, session.userId));
    if (account?.disabledAt) throw new APIError("FORBIDDEN", { message: "This account is disabled. Contact an SU super admin." });
  } } } },
  user: { additionalFields: { role: { type: "string", input: false, defaultValue: "student" } } },
});
