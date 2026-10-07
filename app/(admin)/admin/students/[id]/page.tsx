import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { StudentDetailManager } from "@/components/admin/students/detail/student-detail-manager";

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const user = await requireAdminPage();
  const { id } = await params;

  return <StudentDetailManager studentId={id} role={user.role} />;
}
