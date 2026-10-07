import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { VendorDetailManager } from "@/components/admin/vendors/detail/vendor-detail-manager";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorDetailPage({ params }: PageProps) {
  await connection();
  await requireAdminPage();
  const { id } = await params;

  return <VendorDetailManager vendorId={id} />;
}
