import { getVendorManagerFromRequest,getCurrentUser } from "@/lib/auth/guards";
import { json } from "@/lib/student/http";
export async function requireManager(request:Request){
  const person=await getCurrentUser(request.headers);
  if(!person) return json({error:"Unauthorized"},401);
  return (await getVendorManagerFromRequest(request))??json({error:"Forbidden"},403);
}
