import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/guards";
import { getAreas } from "@/lib/student/service";
import { UserNavDropdown } from "@/components/ui/user-nav-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";
import { StudentDesktopNav, StudentMobileBottomNav } from "@/components/student/student-nav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const person = await getCurrentUser(await headers());
  if (!person) redirect("/login");
  if (person.disabledAt) redirect("/login?error=disabled");

  const areas = await getAreas(person);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-foreground relative isolate selection:bg-brand selection:text-white">
      <AmbientBackdrop />

      {/* Student Top Bar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 px-4 sm:px-6 backdrop-blur-md transition-colors">
        {/* Left: SU Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/card"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg min-h-[44px]"
            aria-label="SU Card Home"
          >
            <Image
              src="/brand/su-logo-color.png"
              alt="Nile University Student Union"
              width={140}
              height={38}
              className="h-8 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/brand/su-logo-white@hd.png"
              alt="Nile University Student Union"
              width={140}
              height={38}
              className="h-8 w-auto object-contain hidden dark:block"
              priority
            />
          </Link>

          {/* Desktop Navigation Links */}
          <StudentDesktopNav />
        </div>

        {/* Right: Theme Toggle & Account Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <UserNavDropdown
            user={{
              id: person.id,
              name: person.name,
              email: person.email,
              role: person.role,
            }}
            areas={areas}
            currentArea="student"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0 max-w-4xl mx-auto p-4 sm:p-6 pb-24 sm:pb-8 flex flex-col justify-start">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <StudentMobileBottomNav />
    </div>
  );
}
