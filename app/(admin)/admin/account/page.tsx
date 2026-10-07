import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { AccountManager } from "@/components/admin/account/account-manager";

export const metadata: Metadata = {
  title: "My Account — SU Card Admin",
  description: "Manage your profile information and security settings.",
};

export default async function AdminAccountPage() {
  await connection();
  const user = await requireAdminPage();

  return <AccountManager user={user} />;
}
