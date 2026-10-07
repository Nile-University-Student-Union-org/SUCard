import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { StudentsManager } from "@/components/admin/students/students-manager";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  await connection();
  const user = await requireAdminPage();

  return <StudentsManager role={user.role} />;
}
