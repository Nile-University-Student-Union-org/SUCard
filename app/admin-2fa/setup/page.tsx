import { requireTwoFactorSetupPage } from "@/lib/auth/guards";
import { TwoFactorSetupWizard } from "./setup-wizard";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export default async function TwoFactorSetupPage() {
  const admin = await requireTwoFactorSetupPage();
  const session = await auth.api.getSession({ headers: await headers() });
  return <TwoFactorSetupWizard admin={admin} passwordRequired={session?.session.loginMethod !== "microsoft"} />;
}
