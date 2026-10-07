import { connection } from "next/server";
import { requireStudentPage } from "@/lib/auth/guards";
import { getStudentHome } from "@/lib/student/service";
import { nusuLogoDataUri } from "@/lib/qr-style/render";
import { renderQrSvgFromConfig } from "@/lib/qr-style/render-core";
import { getWebQrConfig } from "@/lib/qr-studio/service";
import { StudentCardView } from "@/components/student/student-card-view";

export const dynamic = "force-dynamic";

export default async function StudentCardPage() {
  await connection();
  const { user } = await requireStudentPage();

  const home = await getStudentHome(user.id);
  const qrSvg = home.card ? renderQrSvgFromConfig(home.card.qr, await getWebQrConfig(), { logoDataUri: nusuLogoDataUri() }) : null;

  return <StudentCardView home={home} qrSvg={qrSvg} />;
}
