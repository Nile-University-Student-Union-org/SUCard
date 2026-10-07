import { connection } from "next/server";
import { requireStudentPage } from "@/lib/auth/guards";
import { ScanPageClient } from "@/components/student/scan-page-client";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  await connection();
  await requireStudentPage();

  return <ScanPageClient />;
}
