import { connection } from "next/server";
import { requireStudentPage } from "@/lib/auth/guards";
import { DealsView } from "@/components/student/deals-view";

export const dynamic = "force-dynamic";

export default async function StudentDealsPage() {
  await connection();
  await requireStudentPage();

  return <DealsView />;
}
