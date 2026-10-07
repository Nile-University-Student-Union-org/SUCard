import { connection } from "next/server";
import { requireStudentPage } from "@/lib/auth/guards";
import { HistoryView } from "@/components/student/history-view";

export const dynamic = "force-dynamic";

export default async function StudentHistoryPage() {
  await connection();
  await requireStudentPage();

  return <HistoryView />;
}
