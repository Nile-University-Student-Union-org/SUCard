import { requireStudent, json, errorResponse } from "@/lib/student/http";
import { getStudentHome } from "@/lib/student/service";
import { buildSaveUrl, ensureClass, getGoogleWalletConfig, GoogleWalletError, objectId, upsertObject } from "@/lib/wallet/google";
import { getCurrentUser } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const student = await requireStudent(request);
    if (student instanceof Response) {
      if (student.status === 403) {
        const person = await getCurrentUser(request.headers);
        if (person && !person.disabledAt) return json({ error: "Student profile not found" }, 404);
      }
      return student;
    }
    const home = await getStudentHome(student.user.id);
    if (home.profile.status === "suspended") return json({ error: "Student is suspended", code: "suspended" }, 403);
    if (!home.card) return json({ error: "No active card", code: "no_card" }, 409);
    const config = await getGoogleWalletConfig();
    if (!config) return json({ error: "Google Wallet is not configured", code: "wallet_unavailable" }, 503);
    await ensureClass(config);
    await upsertObject(config, home, home.card);
    return json({ saveUrl: buildSaveUrl(config, objectId(config.issuerId, student.user.id)) });
  } catch (error) {
    if (error instanceof GoogleWalletError) {
      console.error("Google Wallet API failed", { status: error.status, message: error.message });
      return json({ error: "Google Wallet is unavailable right now", code: "wallet_error" }, 502);
    }
    return errorResponse(error);
  }
}
