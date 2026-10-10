import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth/guards";
import { mailerTokenKey } from "@/lib/email/credentials";
import { allowedRedirectUri, codeChallenge, createOAuthFlow, mailerFrom, microsoftMailerEnv, oauthBase } from "@/lib/email/microsoft";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response(null, { status: 401 });
  if (admin.role !== "super_admin") return new Response(null, { status: 403 });
  const config = microsoftMailerEnv();
  const redirectUri = allowedRedirectUri(request.url);
  if (!config.success || !mailerTokenKey() || !redirectUri) return new Response(null, { status: 503 });
  const flow = createOAuthFlow(redirectUri, process.env.BETTER_AUTH_SECRET!);
  const authorize = new URL(`${oauthBase(config.data.MICROSOFT_TENANT_ID)}/authorize`);
  authorize.search = new URLSearchParams({ client_id: config.data.MICROSOFT_CLIENT_ID, response_type: "code",
    redirect_uri: redirectUri, response_mode: "query", scope: "offline_access Mail.Send User.Read",
    login_hint: mailerFrom(), prompt: "select_account", state: flow.state,
    code_challenge: codeChallenge(flow.verifier), code_challenge_method: "S256" }).toString();
  const response = NextResponse.redirect(authorize);
  response.cookies.set("mailer_oauth", flow.cookie, { httpOnly: true, secure: redirectUri.startsWith("https:"),
    sameSite: "lax", maxAge: 600, path: "/api/admin/mailer/microsoft/callback" });
  return response;
}
