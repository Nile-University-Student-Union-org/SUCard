import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { StylesLibraryView } from "@/components/admin/qr-studio/styles-library-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QR Studio — SU Card Admin",
  description:
    "Visual QR designer and styles library for Nile University Student Union membership cards.",
};

export default async function AdminQrStudioPage() {
  await connection();
  await requireAdminPage();

  return <StylesLibraryView />;
}
