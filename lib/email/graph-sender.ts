import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { mailerCredentials } from "@/lib/db/schema";
import { decryptRefreshToken, encryptRefreshToken, mailerTokenKey } from "./credentials";
import { microsoftMailerEnv, oauthBase, tokenSchema } from "./microsoft";

export class GraphDisconnectedError extends Error {}

export async function graphConnected(): Promise<boolean> {
  if (!mailerTokenKey() || !microsoftMailerEnv().success) return false;
  const [credential] = await db.select({ status: mailerCredentials.status, token: mailerCredentials.encryptedRefreshToken })
    .from(mailerCredentials).where(eq(mailerCredentials.id, "graph"));
  return credential?.status === "connected" && Boolean(credential.token);
}

export async function graphAccessToken(): Promise<string> {
  const key = mailerTokenKey();
  const config = microsoftMailerEnv();
  if (!key || !config.success) throw new GraphDisconnectedError("Graph mailer is not configured");
  return db.transaction(async (tx) => {
    const [credential] = await tx.select().from(mailerCredentials).where(eq(mailerCredentials.id, "graph")).for("update");
    if (credential?.status !== "connected" || !credential.encryptedRefreshToken)
      throw new GraphDisconnectedError("Graph mailer is disconnected");
    const response = await fetch(`${oauthBase(config.data.MICROSOFT_TENANT_ID)}/token`, { method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: config.data.MICROSOFT_CLIENT_ID, client_secret: config.data.MICROSOFT_CLIENT_SECRET,
        grant_type: "refresh_token", refresh_token: decryptRefreshToken(credential.encryptedRefreshToken, key),
        scope: "offline_access Mail.Send User.Read" }), cache: "no-store" });
    if (!response.ok) {
      const failure = z.object({ error: z.string().optional() }).safeParse(await response.json().catch(() => null));
      if (failure.success && failure.data.error === "invalid_grant") {
        await tx.update(mailerCredentials).set({ status: "disconnected", encryptedRefreshToken: null,
          lastError: "Microsoft sign-in expired. Reconnect the mail sender.", updatedAt: new Date() })
          .where(eq(mailerCredentials.id, "graph"));
        return null;
      }
      throw new Error(`Microsoft token refresh failed (${response.status})`);
    }
    const token = tokenSchema.parse(await response.json());
    await tx.update(mailerCredentials).set({ encryptedRefreshToken: encryptRefreshToken(token.refresh_token, key),
      updatedAt: new Date(), lastError: null }).where(eq(mailerCredentials.id, "graph"));
    return token.access_token;
  }).then((accessToken) => {
    if (!accessToken) throw new GraphDisconnectedError("Microsoft sign-in expired");
    return accessToken;
  });
}

export async function sendGraphMail(message: { to: string; subject: string; html: string }): Promise<void> {
  const accessToken = await graphAccessToken();
  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", { method: "POST", cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { subject: message.subject, body: { contentType: "HTML", content: message.html },
      toRecipients: [{ emailAddress: { address: message.to } }] }, saveToSentItems: false }) });
  if (!response.ok) throw new Error(`Microsoft Graph send failed (${response.status})`);
}
