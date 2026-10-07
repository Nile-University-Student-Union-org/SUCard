import { requireTwoFactorSetupPage } from "@/lib/auth/guards";
export default async function TwoFactorSetupPage() {
  await requireTwoFactorSetupPage();
  return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">Set up two-factor authentication</h1>
    <p>Use an authenticator app to protect your SU Card admin account. The setup controls will be added here.</p></main>;
}
