import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const microsoftEnvSchema = z.object({ MICROSOFT_TENANT_ID: z.uuid(), MICROSOFT_CLIENT_ID: z.uuid(),
  MICROSOFT_CLIENT_SECRET: z.string().min(1) });
export function microsoftMailerEnv() { return microsoftEnvSchema.safeParse(process.env); }
export function mailerFrom() { return z.email().parse(process.env.MAILER_FROM ?? "su@nu.edu.eg"); }
export function oauthBase(tenant: string) { return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`; }

export function allowedRedirectUri(requestUrl: string): string | null {
  const origin = new URL(requestUrl).origin;
  const configured = z.url().safeParse(process.env.BETTER_AUTH_URL);
  const allowed = configured.success && origin === new URL(configured.data).origin &&
    (process.env.NODE_ENV !== "production" || origin.startsWith("https:")) ||
    (process.env.NODE_ENV !== "production" && ["http://localhost:3000", "http://127.0.0.1:3000"].includes(origin));
  return allowed ? `${origin}/api/admin/mailer/microsoft/callback` : null;
}

export function createOAuthFlow(redirectUri: string, secret: string) {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ state, verifier, redirectUri, expires: Date.now() + 10 * 60_000 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return { state, verifier, cookie: `${payload}.${signature}` };
}

export function verifyOAuthFlow(cookie: string | undefined, state: string, secret: string, redirectUri: string) {
  if (!cookie) return null;
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  let decoded: unknown;
  try { decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); }
  catch { return null; }
  const parsed = z.object({ state: z.string(), verifier: z.string(), redirectUri: z.string(), expires: z.number() })
    .safeParse(decoded);
  if (!parsed.success || parsed.data.expires < Date.now() || parsed.data.redirectUri !== redirectUri || parsed.data.state !== state) return null;
  return parsed.data;
}

export function codeChallenge(verifier: string) { return createHash("sha256").update(verifier).digest("base64url"); }
export function matchesMailerAccount(profile: { mail?: string | null; userPrincipalName?: string | null }, from: string) {
  return [profile.mail, profile.userPrincipalName].some((email) => email?.toLowerCase() === from.toLowerCase());
}

export const tokenSchema = z.object({ access_token: z.string().min(1), refresh_token: z.string().min(1) });
