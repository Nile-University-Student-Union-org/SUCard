import type {
  ValidateResponse,
  ConfirmResponse,
  TodayResponse,
  ScanContextResponse,
} from "@/lib/vendors/types";

export async function getScanContext(): Promise<ScanContextResponse> {
  const res = await fetch("/api/scan/context", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load scanner context");
  }
  return res.json();
}

export async function validateQr(qr: string): Promise<ValidateResponse> {
  const res = await fetch("/api/scan/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ qr }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to validate QR code");
  }
  return data;
}

export async function confirmDiscount(
  scanId: string,
  offerId: string,
  billAmount?: number
): Promise<ConfirmResponse> {
  const res = await fetch("/api/scan/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      scanId,
      offerId,
      billAmount: billAmount !== undefined && !isNaN(billAmount) && billAmount > 0 ? billAmount : undefined,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to confirm discount");
  }
  return data;
}

export async function getTodayRedemptions(): Promise<TodayResponse> {
  const res = await fetch("/api/scan/today", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load today's redemptions");
  }
  return res.json();
}
