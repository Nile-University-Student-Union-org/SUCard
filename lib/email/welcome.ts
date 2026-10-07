import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { enqueuePasswordReset } from "./outbox";

export async function sendAccountWelcome(to: string, name: string) {
  const token = randomBytes(24).toString("base64url");
  const ctx = await auth.$context;
  await ctx.internalAdapter.createVerificationValue({ identifier: `reset-password:${token}`, value: (await ctx.internalAdapter.findUserByEmail(to))!.user.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  await enqueuePasswordReset(to, name, token, "account_created");
}
