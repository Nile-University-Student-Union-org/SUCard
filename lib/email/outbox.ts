import { db } from "@/lib/db";
import { emailOutbox } from "@/lib/db/schema";
import { emailTemplate } from "./templates";
import { after } from "next/server";
import { drainOutbox } from "./drain";

export async function enqueueEmail(to: string, name: string, kind: "account_created" | "password_reset" | "card_suspended", link?: string) {
  const content = emailTemplate(kind, name, link);
  await db.insert(emailOutbox).values({ to, kind, ...content });
  after(async () => { await drainOutbox(20); });
}
export async function enqueuePasswordReset(to: string, name: string, token: string, kind: "account_created" | "password_reset" = "password_reset") {
  const base = process.env.PUBLIC_BASE_URL ?? process.env.BETTER_AUTH_URL;
  if (!base) throw new Error("Public base URL is required for password reset email");
  const link = new URL(`/reset-password?token=${encodeURIComponent(token)}`, base).href;
  await enqueueEmail(to, name, kind, link);
}
