import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { getAreas } from "@/lib/student/service";
import { ChooseTiles } from "@/components/choose/choose-tiles";

export const dynamic = "force-dynamic";

export default async function ChoosePage() {
  await connection();

  const person = await getCurrentUser(await headers());
  if (!person) redirect("/login");
  if (person.disabledAt) redirect("/login?error=disabled");

  const areas = await getAreas(person);
  if (areas.length <= 1) {
    redirect("/go");
  }

  return <ChooseTiles areas={areas} userName={person.name} />;
}
