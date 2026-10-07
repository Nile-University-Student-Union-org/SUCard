import { requireTwoFactorSetupPage } from "@/lib/auth/guards";
import { TwoFactorSetupWizard } from "./setup-wizard";

export default async function TwoFactorSetupPage() {
  const admin = await requireTwoFactorSetupPage();
  return <TwoFactorSetupWizard admin={admin} />;
}
