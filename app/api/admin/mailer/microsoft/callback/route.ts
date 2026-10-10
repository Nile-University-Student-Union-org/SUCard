import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLog, mailerCredentials } from "@/lib/db/schema";
import { getAdminFromRequest } from "@/lib/auth/guards";
import { encryptRefreshToken, mailerTokenKey } from "@/lib/email/credentials";
import { allowedRedirectUri, mailerFrom, matchesMailerAccount, microsoftMailerEnv, oauthBase, tokenSchema, verifyOAuthFlow } from "@/lib/email/microsoft";

export const runtime = "nodejs";
const querySchema = z.object({ state: z.string().min(1).optional(), code: z.string().min(1).optional(), error: z.string().optional(),
  error_description: z.string().optional() });
const profileSchema = z.object({ mail: z.string().nullable().optional(), userPrincipalName: z.string().nullable().optional() });

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response(null, { status: 401 });
  if (admin.role !== "super_admin") return new Response(null, { status: 403 });
  const redirectUri = allowedRedirectUri(request.url);
  if (!redirectUri) return new Response(null, { status: 400 });
  const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const flow = verifyOAuthFlow(request.cookies.get("mailer_oauth")?.value, query.success ? query.data.state ?? "" : "",
    process.env.BETTER_AUTH_SECRET!, redirectUri);
  if (!flow) return finish(request, "state");
  if (query.success && query.data.error) return finish(request,
    /AADSTS65001|admin approval/i.test(query.data.error_description ?? "") ? "consent" : "authorization");
  if (!query.success || !query.data.code) return finish(request, "authorization");
  const config = microsoftMailerEnv();
  const key = mailerTokenKey();
  if (!config.success || !key) return finish(request, "configuration");
  const tokenResponse = await fetch(`${oauthBase(config.data.MICROSOFT_TENANT_ID)}/token`, { method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.data.MICROSOFT_CLIENT_ID, client_secret: config.data.MICROSOFT_CLIENT_SECRET,
      grant_type: "authorization_code", code: query.data.code, code_verifier: flow.verifier, redirect_uri: redirectUri }) });
  if (!tokenResponse.ok) return finish(request, "token");
  const token = tokenSchema.safeParse(await tokenResponse.json());
  if (!token.success) return finish(request, "token");
  const profileResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${token.data.access_token}` }, cache: "no-store" });
  if (!profileResponse.ok) return finish(request, "account");
  const profile = profileSchema.safeParse(await profileResponse.json());
  const accountEmail = mailerFrom();
  if (!profile.success || !matchesMailerAccount(profile.data, accountEmail)) return finish(request, "account");
  const encryptedRefreshToken = encryptRefreshToken(token.data.refresh_token, key);
  await db.transaction(async (tx) => {
    await tx.insert(mailerCredentials).values({ id: "graph", accountEmail, encryptedRefreshToken,
      status: "connected", connectedAt: new Date(), updatedAt: new Date(), connectedBy: admin.id, lastError: null })
      .onConflictDoUpdate({ target: mailerCredentials.id, set: { accountEmail, encryptedRefreshToken,
        status: "connected", connectedAt: new Date(), updatedAt: new Date(), connectedBy: admin.id, lastError: null } });
    await tx.insert(auditLog).values({ actorId: admin.id, action: "mailer.connected", entity: "mailer", entityId: "graph", data: { accountEmail } });
  });
  return finish(request, "connected");
}

function finish(request: NextRequest, flag: string) {
  const url = new URL("/admin/settings", request.url);
  url.searchParams.set("mailer", flag);
  const response = NextResponse.redirect(url);
  response.cookies.set("mailer_oauth", "", { path: "/api/admin/mailer/microsoft/callback", maxAge: 0,
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax" });
  return response;
}
