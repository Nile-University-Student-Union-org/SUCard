import { connection } from "next/server";
import { requireOnboardingPage } from "@/lib/auth/guards";
import { WelcomeForm } from "@/components/student/welcome-form";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  await connection();
  const person = await requireOnboardingPage();

  return <WelcomeForm name={person.name} email={person.email} />;
}
