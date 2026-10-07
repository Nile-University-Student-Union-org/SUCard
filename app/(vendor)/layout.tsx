import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { requireVendorManagerPage } from "@/lib/auth/guards";
import { getAreas } from "@/lib/student/service";
import { UserNavDropdown } from "@/components/ui/user-nav-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const { person, vendor } = await requireVendorManagerPage();
  const areas = await getAreas(person);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-foreground relative isolate">
      <AmbientBackdrop />

      {/* Vendor Portal Top Bar */}
      <header className="sticky top-0 z-30 flex h-16 w-full min-w-0 items-center justify-between gap-2 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 px-4 sm:px-6 backdrop-blur-md">
        {/* Left: Vendor Logo & Name */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/vendor"
            className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg min-h-[44px]"
            aria-label="Vendor Portal Home"
          >
            <div className="size-9 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              {vendor.logoId ? (
                <Image
                  src={`/api/vendors/${vendor.id}/logo`}
                  alt={vendor.name}
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="font-heading text-xs font-bold text-brand dark:text-brand-soft">
                  {vendor.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <span className="font-heading text-lg uppercase tracking-wide text-foreground truncate block">
                {vendor.name}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Partner Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Theme Toggle & User Menu */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <UserNavDropdown
            user={{
              id: person.id,
              name: person.name,
              email: person.email,
              role: person.role,
            }}
            areas={areas}
            currentArea="vendor"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
