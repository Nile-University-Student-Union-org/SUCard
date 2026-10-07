import type { ListAuditResponse } from "@/lib/staff/types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ListAuditParams {
  action?: string;
  actorId?: string;
  cursor?: string;
  limit?: number;
}

export async function listAudit(params: ListAuditParams = {}): Promise<ListAuditResponse> {
  const query = new URLSearchParams();
  if (params.action) query.set("action", params.action);
  if (params.actorId) query.set("actorId", params.actorId);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));

  const url = `/api/admin/audit${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") {
        errorMessage = data.error;
      }
    } catch {
      // Keep default message
    }
    throw new ApiError(res.status, errorMessage);
  }

  return res.json();
}
