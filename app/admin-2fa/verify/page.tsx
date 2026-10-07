import { requireTwoFactorVerifyPage } from "@/lib/auth/guards";
import { VerifyAdminFactor } from "./verify-admin-factor";

export default async function VerifyAdminFactorPage() {
  await requireTwoFactorVerifyPage();
  return <VerifyAdminFactor />;
}
