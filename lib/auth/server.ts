import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { STAFF_PASSWORD_MIN, STAFF_PASSWORD_MAX } from "@/lib/staff/types";
import { getSettings } from "@/lib/settings/service";
import { matchesStudentEmail } from "@/lib/student/rules";

const microsoftEnv = z.object({ MICROSOFT_TENANT_ID: z.uuid(), MICROSOFT_CLIENT_ID: z.uuid(), MICROSOFT_CLIENT_SECRET: z.string().min(1) })
  .safeParse(process.env);

export const auth = betterAuth({
  secret: z.string().min(32).parse(process.env.BETTER_AUTH_SECRET),
  baseURL: z.url().parse(process.env.BETTER_AUTH_URL),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: microsoftEnv.success ? { microsoft: {
    clientId: microsoftEnv.data.MICROSOFT_CLIENT_ID, clientSecret: microsoftEnv.data.MICROSOFT_CLIENT_SECRET,
    tenantId: microsoftEnv.data.MICROSOFT_TENANT_ID, disableDefaultScope: true, scope: ["openid", "profile", "email"], disableProfilePhoto: true,
    overrideUserInfoOnSignIn: true,
    mapProfileToUser: async (profile) => {
      if (profile.tid?.toLowerCase() !== microsoftEnv.data.MICROSOFT_TENANT_ID.toLowerCase() || !profile.oid)
        throw new APIError("FORBIDDEN", { code: "invalid_tenant", message: "Invalid Microsoft tenant" });
      const email = (profile.email || profile.preferred_username || "").toLowerCase();
      const [existing] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email));
      if (!existing && !matchesStudentEmail(email, (await getSettings()).studentEmailPattern))
        throw new APIError("FORBIDDEN", { code: "not_student", message: "Not an eligible student email" });
      return { email, name: profile.name || email };
    },
  } } : {},
  account: { accountLinking: { trustedProviders: ["microsoft"] } },
  onAPIError: { errorURL: "/login" },
  hooks: { before: createAuthMiddleware(async (ctx) => {
    const input = ctx as typeof ctx & { path?: string };
    if (input.path === "/update-user" || input.path === "/change-email")
      throw new APIError("FORBIDDEN", { message: "Name and email are managed by SU or Microsoft" });
    if (input.path === "/sign-in/email" || input.path === "/sign-in/social") {
      return { context: { body: { ...(ctx.body as unknown as Record<string, unknown>), callbackURL: "/go", errorCallbackURL: "/login" } } };
    }
  }) },
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: STAFF_PASSWORD_MIN, maxPasswordLength: STAFF_PASSWORD_MAX },
  rateLimit: { enabled: true, storage: "memory", customRules: { "/sign-in/email": { window: 60, max: 5 } } },
  databaseHooks: { session: { create: { before: async (session) => {
    const [account] = await db.select({ disabledAt: schema.user.disabledAt }).from(schema.user).where(eq(schema.user.id, session.userId));
    if (account?.disabledAt) throw new APIError("FORBIDDEN", { message: "This account is disabled. Contact an SU super admin." });
  } } } },
  user: { additionalFields: { role: { type: "string", input: false, defaultValue: "student" } } },
});
