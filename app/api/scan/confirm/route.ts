import { cashier, errorResponse, json, parseBody } from "@/lib/vendors/http";
import { confirmBody } from "@/lib/vendors/validation";
import { confirmScan } from "@/lib/vendors/scan";
import { notifyRedemption } from "@/lib/wallet/google";
import { after } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { const actor = await cashier(request); if (actor instanceof Response) return actor; try {
  const body = await parseBody(request, confirmBody);
  const { response, notification } = await confirmScan(actor, body.scanId, body.offerId, body.billAmount);
  const result = json(response);
  if (notification) after(() => notifyRedemption(notification));
  return result;
} catch (error) { return errorResponse(error); } }
