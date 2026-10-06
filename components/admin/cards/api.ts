import type {
  ListBatchesResponse,
  CreateBatchRequest,
  CreateBatchResponse,
  ExportOptions,
  ApiError,
} from "@/lib/cards/types";

export class CardApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "CardApiError";
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `HTTP error ${res.status}: ${res.statusText || "Request failed"}`;
    try {
      const errorData = (await res.json()) as ApiError;
      if (errorData && typeof errorData.error === "string") {
        errorMessage = errorData.error;
      }
    } catch {
      // Body is not JSON, use default status error message
    }
    throw new CardApiError(errorMessage, res.status);
  }

  return (await res.json()) as T;
}

/**
 * Fetch all batches, newest first.
 */
export async function listBatches(): Promise<ListBatchesResponse> {
  const res = await fetch("/api/admin/batches", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  return handleResponse<ListBatchesResponse>(res);
}

/**
 * Generate a new batch of physical cards.
 */
export async function createBatch(data: CreateBatchRequest): Promise<CreateBatchResponse> {
  const res = await fetch("/api/admin/batches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse<CreateBatchResponse>(res);
}

/**
 * Construct the export URL for a batch ZIP download.
 */
export function getBatchExportUrl(batchId: string, options: ExportOptions): string {
  const params = new URLSearchParams();
  params.set("svg", options.svg ? "1" : "0");
  params.set("png", options.png ? "1" : "0");
  params.set("pngSize", String(options.pngSize));

  return `/api/admin/batches/${encodeURIComponent(batchId)}/export?${params.toString()}`;
}
