import type {
  ListStylesResponse,
  GetStyleResponse,
  CreateStyleRequest,
  UpdateStyleRequest,
  PublishStyleRequest,
  PublishStyleResponse,
  SetDefaultStyleRequest,
  ImportStyleRequest,
  GetVersionResponse,
  PreviewStyleRequest,
  SampleTokensResponse,
} from "@/lib/qr-studio/types";

export class StudioApiError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "StudioApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP error ${res.status}: ${res.statusText || "Request failed"}`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") {
        errorMsg = data.error;
      }
    } catch {
      // Body not JSON
    }
    throw new StudioApiError(errorMsg, res.status);
  }
  return res.json() as Promise<T>;
}

export async function listStyles(): Promise<ListStylesResponse> {
  const res = await fetch("/api/admin/qr-styles", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return handleResponse<ListStylesResponse>(res);
}

export async function getStyle(id: string): Promise<GetStyleResponse> {
  const res = await fetch(`/api/admin/qr-styles/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return handleResponse<GetStyleResponse>(res);
}

export async function createStyle(data: CreateStyleRequest): Promise<GetStyleResponse> {
  const res = await fetch("/api/admin/qr-styles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<GetStyleResponse>(res);
}

export async function updateStyle(
  id: string,
  data: UpdateStyleRequest
): Promise<GetStyleResponse> {
  const res = await fetch(`/api/admin/qr-styles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<GetStyleResponse>(res);
}

export async function publishStyle(
  id: string,
  data: PublishStyleRequest
): Promise<PublishStyleResponse> {
  const res = await fetch(`/api/admin/qr-styles/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<PublishStyleResponse>(res);
}

export async function setDefaultStyle(
  id: string,
  data: SetDefaultStyleRequest
): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/admin/qr-styles/${encodeURIComponent(id)}/default`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function archiveStyle(id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/admin/qr-styles/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function unarchiveStyle(id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/admin/qr-styles/${encodeURIComponent(id)}/unarchive`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function importStyle(data: ImportStyleRequest): Promise<GetStyleResponse> {
  const res = await fetch("/api/admin/qr-styles/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<GetStyleResponse>(res);
}

export async function getSampleTokens(count = 8): Promise<SampleTokensResponse> {
  const res = await fetch(`/api/admin/qr-styles/sample-tokens?count=${count}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return handleResponse<SampleTokensResponse>(res);
}

export async function getVersion(versionId: string): Promise<GetVersionResponse> {
  const res = await fetch(`/api/admin/qr-styles/versions/${encodeURIComponent(versionId)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return handleResponse<GetVersionResponse>(res);
}

export async function downloadExportJson(id: string, name: string): Promise<void> {
  const res = await fetch(`/api/admin/qr-styles/${encodeURIComponent(id)}/export`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new StudioApiError("Failed to export style", res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `qr-style-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPreviewFile(
  req: PreviewStyleRequest,
  filename: string
): Promise<void> {
  const res = await fetch("/api/admin/qr-styles/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let err = "Download failed";
    try {
      const data = await res.json();
      if (data?.error) err = data.error;
    } catch {}
    throw new StudioApiError(err, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
