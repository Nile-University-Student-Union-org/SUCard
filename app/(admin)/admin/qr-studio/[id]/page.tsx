import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { getStyle } from "@/lib/qr-studio/service";
import { notFound } from "next/navigation";
import { EditorView } from "@/components/admin/qr-studio/editor/editor-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const style = await getStyle(id);
    return {
      title: `${style?.name || "Editor"} — QR Studio — SU Card Admin`,
    };
  } catch {
    return {
      title: "QR Studio Editor — SU Card Admin",
    };
  }
}

export default async function AdminQrStudioEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await requireAdminPage();
  const { id } = await params;

  let style;
  try {
    style = await getStyle(id);
  } catch {
    notFound();
  }

  if (!style) {
    notFound();
  }

  return <EditorView initialStyle={style} />;
}
