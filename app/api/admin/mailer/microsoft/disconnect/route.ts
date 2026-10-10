import { eq } from "drizzle-orm";
import { getAdminFromRequest } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { auditLog, mailerCredentials } from "@/lib/db/schema";

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return new Response(null, { status: 401 });
  if (admin.role !== "super_admin") return new Response(null, { status: 403 });
  await db.transaction(async (tx) => {
    await tx.update(mailerCredentials).set({ encryptedRefreshToken: null, status: "disconnected", lastError: null,
      updatedAt: new Date() }).where(eq(mailerCredentials.id, "graph"));
    await tx.insert(auditLog).values({ actorId: admin.id, action: "mailer.disconnected", entity: "mailer", entityId: "graph", data: {} });
  });
  return Response.json({ status: "disconnected" }, { headers: { "Cache-Control": "no-store" } });
}
