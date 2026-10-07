import { connection } from "next/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { getAreas } from "@/lib/student/service";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const user = await requireAdminPage();
  const areas = await getAreas({ ...user, disabledAt: null });

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <AdminSidebar role={user.role} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader user={user} areas={areas} />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
