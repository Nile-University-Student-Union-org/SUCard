import type { Metadata } from "next";
import { connection } from "next/server";
import { requireSuperAdminPage } from "@/lib/auth/guards";
import { StaffManager } from "@/components/admin/staff/staff-manager";

export const metadata: Metadata = {
  title: "Staff — SU Card Admin",
  description: "Manage who can sign in to the SU Card admin panel.",
};

export default async function AdminStaffPage() {
  await connection();
  const user = await requireSuperAdminPage();

  return <StaffManager currentUser={user} />;
}
