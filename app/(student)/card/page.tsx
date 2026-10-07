import { connection } from "next/server";
import { requireStudentPage } from "@/lib/auth/guards";
import { getStudentHome } from "@/lib/student/service";
import { renderQrSvg } from "@/lib/qr-style/render";
import { StudentCardView } from "@/components/student/student-card-view";

export const dynamic = "force-dynamic";

export default async function StudentCardPage() {
  await connection();
  const { user } = await requireStudentPage();

  const home = await getStudentHome(user.id);
  const qrSvg = home.card ? renderQrSvg(home.card.qr) : null;

  return <StudentCardView home={home} qrSvg={qrSvg} />;
}
