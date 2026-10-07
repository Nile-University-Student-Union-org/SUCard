import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { getAreas } from "@/lib/student/service";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";
import { StudentNav } from "@/components/student/student-nav";

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

      {/* Floating Student Top Navbar */}
      <StudentNav
        user={{
          id: person.id,
          name: person.name,
          email: person.email,
          role: person.role,
        }}
        areas={areas}
      />

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0 max-w-4xl mx-auto p-4 sm:p-6 pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 flex flex-col justify-start">
        {children}
      </main>
    </div>
  );
}
