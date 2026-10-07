import { cashier, json } from "@/lib/vendors/http";
import { vendorIsActive } from "@/lib/vendors/rules";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { const actor = await cashier(request); if (actor instanceof Response) return actor; return json({ cashierName: actor.person.name, vendorName: actor.vendor.name, vendorLogoUrl: actor.vendor.logoId ? `/api/vendors/${actor.vendor.id}/logo` : null, branchName: actor.branch!.name, vendorActive: vendorIsActive(actor.vendor, actor.branch!, new Date()) }); }
