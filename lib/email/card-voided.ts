import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOutbox, user } from "@/lib/db/schema";
import { getSettings } from "@/lib/settings/service";
import { emailTemplate } from "./templates";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function enqueueCardVoided(tx: Tx, studentId: string, cardType: "digital" | "physical", reason: string) {
  const [person] = await tx.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, studentId));
  if (!person) return false;
  const officeLocation = (await getSettings(tx as unknown as typeof db)).office.location;
  await tx.insert(emailOutbox).values({ to: person.email, kind: "card_voided",
    ...emailTemplate("card_voided", person.name, undefined, { cardType, reason, officeLocation }) });
  return true;
}
