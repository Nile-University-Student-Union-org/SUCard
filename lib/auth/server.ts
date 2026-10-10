import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { symmetricDecrypt } from "better-auth/crypto";
import { STAFF_PASSWORD_MIN, STAFF_PASSWORD_MAX } from "@/lib/staff/types";
import { getSettings } from "@/lib/settings/service";
import { matchesStudentEmail } from "@/lib/student/rules";
import { twoFactor } from "better-auth/plugins";
import { sessionExpiry } from "./policy";
import { enqueuePasswordReset } from "@/lib/email/outbox";
import { clearPasswordFailures, isPasswordLocked, recordPasswordFailure } from "./password-lockout";

const microsoftEnv = z.object({ MICROSOFT_TENANT_ID: z.uuid(), MICROSOFT_CLIENT_ID: z.uuid(), MICROSOFT_CLIENT_SECRET: z.string().min(1) })
  .safeParse(process.env);

type AuthHookContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];
async function devTotpCode(ctx: AuthHookContext): Promise<string | null> {
  let userId = (await getSessionFromCtx(ctx).catch(() => null))?.user.id;
  if (!userId) {
    const pending = await ctx.getSignedCookie(ctx.context.createAuthCookie("two_factor").name, ctx.context.secret);
    userId = pending ? (await ctx.context.internalAdapter.findVerificationValue(pending))?.value : undefined;
  }
  if (!userId) return null;
  const [row] = await db.select({ secret: schema.twoFactor.secret }).from(schema.twoFactor).where(eq(schema.twoFactor.userId, userId));
  if (!row) return null;
  const secret = await symmetricDecrypt({ key: ctx.context.secretConfig, data: row.secret });
  return (await auth.api.generateTOTP({ body: { secret } })).code;
}

export const auth = betterAuth({
  appName: "SU Card",
  plugins: [twoFactor({ issuer: "SU Card", allowPasswordless: true, trustDeviceMaxAge: 30 * 24 * 60 * 60 })],
  secret: z.string().min(32).parse(process.env.BETTER_AUTH_SECRET),
  baseURL: z.url().parse(process.env.BETTER_AUTH_URL),
  // Extra origins allowed to call the auth API (e.g. a dev tunnel), comma-separated.
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: microsoftEnv.success ? { microsoft: {
    clientId: microsoftEnv.data.MICROSOFT_CLIENT_ID, clientSecret: microsoftEnv.data.MICROSOFT_CLIENT_SECRET,
    tenantId: microsoftEnv.data.MICROSOFT_TENANT_ID, disableDefaultScope: true, scope: ["openid", "profile", "email"], disableProfilePhoto: true,
    overrideUserInfoOnSignIn: true,
    mapProfileToUser: async (profile) => {
      if (profile.tid?.toLowerCase() !== microsoftEnv.data.MICROSOFT_TENANT_ID.toLowerCase() || !profile.oid)
        throw new APIError("FORBIDDEN", { code: "invalid_tenant", message: "Invalid Microsoft tenant" });
      const email = (profile.email || profile.preferred_username || "").toLowerCase();
      if (!matchesStudentEmail(email, (await getSettings()).studentEmailPattern))
        throw new APIError("FORBIDDEN", { code: "not_student", message: "Not an eligible student email" });
      return { email, name: profile.name || email };
    },
  } } : {},
  account: { accountLinking: { enabled: false } },
  onAPIError: { errorURL: "/login" },
  hooks: { before: createAuthMiddleware(async (ctx) => {
    const input = ctx as typeof ctx & { path?: string };
    if (input.path === "/update-user" || input.path === "/change-email")
      throw new APIError("FORBIDDEN", { message: "Name and email are managed by SU or Microsoft" });
    // Local dev only: "123456" is swapped for the user's real current TOTP code.
    if (process.env.NODE_ENV === "development" && input.path === "/two-factor/verify-totp"
      && (ctx.body as { code?: unknown } | undefined)?.code === "123456") {
      const code = await devTotpCode(ctx);
      if (code) return { context: { body: { ...(ctx.body as unknown as Record<string, unknown>), code } } };
    }
    if (input.path === "/request-password-reset") {
      // Pattern match only (not account lookup), so this reveals nothing about who has an account.
      const email = z.string().max(320).safeParse((ctx.body as { email?: unknown } | undefined)?.email);
      if (email.success && matchesStudentEmail(email.data.toLowerCase(), (await getSettings()).studentEmailPattern))
        throw new APIError("BAD_REQUEST", { code: "student_email", message: "Students sign in with Microsoft." });
    }
    if (input.path === "/sign-in/email") {
      const email = z.string().max(320).safeParse((ctx.body as { email?: unknown } | undefined)?.email);
      if (email.success && await isPasswordLocked(email.data))
        throw new APIError("TOO_MANY_REQUESTS", { message: "Too many attempts. Try again in 15 minutes." });
    }
    if (input.path === "/sign-in/email" || input.path === "/sign-in/social") {
      return { context: { body: { ...(ctx.body as unknown as Record<string, unknown>), callbackURL: "/go", errorCallbackURL: "/login" } } };
    }
  }), after: createAuthMiddleware(async (ctx) => {
    if (ctx.path === "/two-factor/verify-totp" || ctx.path === "/two-factor/verify-backup-code") {
      if (ctx.context.returned instanceof APIError) return;
      const current = await auth.api.getSession({ headers: ctx.headers ?? new Headers() });
      if (current?.session.loginMethod === "microsoft") {
        await db.insert(schema.verification).values({ id: crypto.randomUUID(),
          identifier: `admin-2fa:${current.session.id}`, value: current.user.id, expiresAt: current.session.expiresAt });
      }
      return;
    }
    if (ctx.path !== "/sign-in/email") return;
    const email = z.string().max(320).safeParse((ctx.body as { email?: unknown } | undefined)?.email);
    if (email.success) {
      const returned = ctx.context.returned;
      if (returned instanceof APIError) {
        if (returned.body?.code === "INVALID_EMAIL_OR_PASSWORD") await recordPasswordFailure(email.data);
      } else await clearPasswordFailures(email.data);
    }
    if (ctx.context.newSession?.user.role !== "cashier") return;
    const cookie = ctx.context.authCookies.sessionToken;
    await ctx.setSignedCookie(cookie.name, ctx.context.newSession.session.token, ctx.context.secret,
      { ...cookie.attributes, maxAge: 30 * 24 * 60 * 60 });
  }) },
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: STAFF_PASSWORD_MIN, maxPasswordLength: STAFF_PASSWORD_MAX,
    revokeSessionsOnPasswordReset: true,
    // Students sign in with Microsoft only: silently skip so the response stays identical (no enumeration).
    sendResetPassword: async ({ user, token }) => {
      if ((user as { role?: string }).role === "student") return;
      await enqueuePasswordReset(user.email, user.name, token);
    } },
  rateLimit: { enabled: true, storage: "database", customRules: { "/sign-in/email": { window: 60, max: 5 },
    "/request-password-reset": { window: 60, max: 3 }, "/two-factor/*": { window: 60, max: 5 } } },
  databaseHooks: { session: { create: { before: async (session, context) => {
    const [account] = await db.select({ disabledAt: schema.user.disabledAt, role: schema.user.role }).from(schema.user).where(eq(schema.user.id, session.userId));
    if (account?.disabledAt) throw new APIError("FORBIDDEN", { message: "This account is disabled. Contact an SU super admin." });
    const loginMethod = context?.path?.startsWith("/callback/microsoft") ? "microsoft" : "password";
    if ((account?.role ?? "student") === "student" && loginMethod !== "microsoft")
      throw new APIError("FORBIDDEN", { message: "Students sign in with Microsoft." });
    return { data: { ...session, expiresAt: sessionExpiry(account?.role ?? "student", session.expiresAt), loginMethod } };
  } } } },
  session: { additionalFields: { loginMethod: { type: "string", input: false, defaultValue: "password" } } },
  user: { additionalFields: { role: { type: "string", input: false, defaultValue: "student" } } },
});
