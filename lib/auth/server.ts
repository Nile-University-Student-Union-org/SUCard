import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  secret: z.string().min(32).parse(process.env.BETTER_AUTH_SECRET),
  baseURL: z.url().parse(process.env.BETTER_AUTH_URL),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  user: { additionalFields: { role: { type: "string", input: false, defaultValue: "student" } } },
});
