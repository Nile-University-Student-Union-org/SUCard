import type {
  ListStaffResponse,
  CreateStaffRequest,
  CreateStaffResponse,
  UpdateStaffRequest,
  UpdateStaffResponse,
  ResetStaffPasswordRequest,
} from "@/lib/staff/types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") {
        errorMessage = data.error;
      }
    } catch {
      // Keep default message if not JSON
    }
    throw new ApiError(res.status, errorMessage);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export async function listStaff(): Promise<ListStaffResponse> {
  const res = await fetch("/api/admin/staff", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  return handleResponse<ListStaffResponse>(res);
}

export async function createStaff(payload: CreateStaffRequest): Promise<CreateStaffResponse> {
  const res = await fetch("/api/admin/staff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<CreateStaffResponse>(res);
}

export async function updateStaff(id: string, payload: UpdateStaffRequest): Promise<UpdateStaffResponse> {
  const res = await fetch(`/api/admin/staff/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<UpdateStaffResponse>(res);
}

export async function resetStaffPassword(id: string, payload: ResetStaffPasswordRequest): Promise<void> {
  const res = await fetch(`/api/admin/staff/${encodeURIComponent(id)}/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<void>(res);
}

export async function resetStaffTwoFactor(id: string): Promise<void> {
  const res = await fetch(`/api/admin/staff/${encodeURIComponent(id)}/reset-2fa`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });
  return handleResponse<void>(res);
}

