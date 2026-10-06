// Shared contract between the card backend (lib/cards, app/api/admin/batches)
// and the admin UI (app/(admin)/admin/cards). Change only with both sides in mind.

export type CardStatus = "unassigned" | "active" | "void";
export type CardType = "physical" | "digital";

/** What a QR on a card encodes. `code` = "NUSU1:<TOKEN>" (no domain needed). */
export type QrPayloadFormat = "code";

export interface BatchStats {
  unassigned: number;
  active: number;
  void: number;
}

/** JSON shape returned by GET/POST /api/admin/batches. Dates are ISO strings. */
export interface Batch {
  id: string;
  number: number; // 1, 2, 3 … shown as "Batch 003"
  label: string;
  count: number;
  firstSerial: string; // e.g. "SU-000001"
  lastSerial: string; // e.g. "SU-001000"
  payloadFormat: QrPayloadFormat;
  createdAt: string;
  createdByEmail: string | null;
  stats: BatchStats;
}

export interface ListBatchesResponse {
  batches: Batch[];
}

export interface CreateBatchRequest {
  label: string; // 1–80 chars
  count: number; // integer 1–20000
}

export interface CreateBatchResponse {
  batch: Batch;
}

/** Query string for GET /api/admin/batches/:id/export (returns application/zip). */
export interface ExportOptions {
  svg: boolean; // include qr/svg/*.svg (default true)
  png: boolean; // include qr/png/*.png (default false)
  pngSize: 600 | 1200 | 2400; // pixel width of each PNG (default 1200)
}

export const BATCH_COUNT_MAX = 20000;
export const BATCH_LABEL_MAX = 80;
export const PNG_SIZES = [600, 1200, 2400] as const;

/** Error body for any 4xx/5xx from the admin API. */
export interface ApiError {
  error: string;
}
