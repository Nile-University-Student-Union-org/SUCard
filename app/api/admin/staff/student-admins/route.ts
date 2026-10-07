import { errorResponse, json, parseBody, superAdmin } from "@/lib/staff/http";
import { grantStudentAdmins, listStudentAdminGrants, lookupStudentAdminIds } from "@/lib/staff/student-admin-service";
import { studentAdminIdsSchema } from "@/lib/staff/student-admin-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await superAdmin(request);
  if (actor instanceof Response) return actor;
  try { return json({ grants: await listStudentAdminGrants() }); } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  const actor = await superAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const { ids } = await parseBody(request, studentAdminIdsSchema);
    return json({ grants: await grantStudentAdmins(ids, actor.id) }, 201);
  } catch (error) { return errorResponse(error); }
}

export async function PUT(request: Request) {
  const actor = await superAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const { ids } = await parseBody(request, studentAdminIdsSchema);
    return json({ students: await lookupStudentAdminIds(ids) });
  } catch (error) { return errorResponse(error); }
}
