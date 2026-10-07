import type {
  RedemptionsResponse,
  VoidRedemptionResponse,
  ListVendorsResponse,
} from "@/lib/vendors/types";

export interface ListRedemptionsParams {
  vendorId?: string;
  result?: string;
  confirmed?: "true" | "false";
  cursor?: string;
}

export async function listRedemptions(
  params: ListRedemptionsParams = {}
): Promise<RedemptionsResponse> {
  const query = new URLSearchParams();
  if (params.vendorId) query.set("vendorId", params.vendorId);
  if (params.result) query.set("result", params.result);
  if (params.confirmed) query.set("confirmed", params.confirmed);
  if (params.cursor) query.set("cursor", params.cursor);

  const url = `/api/admin/redemptions${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load redemptions ledger");
  }
  return res.json();
}

export async function voidRedemption(
  id: string,
  reason: string
): Promise<VoidRedemptionResponse> {
  const res = await fetch(`/api/admin/redemptions/${id}/void`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to void redemption");
  }
  return data;
}

export async function listVendorsForFilter(): Promise<ListVendorsResponse> {
  const res = await fetch("/api/admin/vendors", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    return { vendors: [] };
  }
  return res.json();
}
