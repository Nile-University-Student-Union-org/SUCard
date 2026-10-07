import { z } from "zod";
import { setStudentFlow } from "@/lib/student/admin";
import { errorResponse, json, parseBody, requireAdmin } from "@/lib/student/http";
import { studentDetail } from "@/lib/analytics/service";
import { correctStudent } from "@/lib/analytics/students";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor=await requireAdmin(request); if(actor instanceof Response) return actor;
  try { const {id}=z.object({id:z.string().min(1)}).parse(await params); const cursor=z.string().max(512).optional().parse(new URL(request.url).searchParams.get("cursor")??undefined); const detail=await studentDetail(id,cursor); return detail?json(detail):json({error:"Student not found"},404); } catch(error){return errorResponse(error);}
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(await params);
    const patch=await parseBody(request,z.strictObject({cardFlow:z.enum(["digital","physical"]).optional(),name:z.string().trim().min(1).max(160).optional(),universityId:z.string().regex(/^\d{9}$/).optional()}).refine(v=>Object.keys(v).length>0));
    if(patch.name!==undefined||patch.universityId!==undefined) await correctStudent(id,{name:patch.name,universityId:patch.universityId},actor.id);
    if(patch.cardFlow) await setStudentFlow(id,patch.cardFlow,actor.id);
    return json(await studentDetail(id));
  } catch (error) { return errorResponse(error); }
}
