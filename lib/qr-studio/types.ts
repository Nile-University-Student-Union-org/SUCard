import type { QrStyleConfig } from "@/lib/qr-style/config";
import type { CheckResult } from "@/lib/qr-style/checks";
export type { QrStyleConfig, CheckResult };
export type QrStyleStatus = "draft" | "published" | "archived";
export interface QrStyleVersionDto { id: string; styleId: string; version: number; config: QrStyleConfig; checks: CheckResult; acceptedWarningsReason: string | null; publishedAt: string }
export interface QrStyleDto { id: string; name: string; status: QrStyleStatus; isDefaultPrint: boolean; isDefaultWeb: boolean; draftConfig: QrStyleConfig; createdAt: string; updatedAt: string; latestVersion: QrStyleVersionDto | null }
export interface ListStylesResponse { styles: QrStyleDto[] }
export interface GetStyleResponse { style: QrStyleDto }
export interface CreateStyleRequest { name: string; preset?: keyof typeof import("@/lib/qr-style/config").QR_PRESETS; duplicateVersionId?: string; config?: QrStyleConfig }
export interface UpdateStyleRequest { name?: string; draftConfig?: QrStyleConfig }
export interface PublishStyleRequest { acceptWarningsReason?: string }
export interface PublishStyleResponse { version: QrStyleVersionDto }
export interface SetDefaultStyleRequest { target: "print" | "web" }
export interface ExportStyleResponse { schemaVersion: 1; name: string; config: QrStyleConfig }
export type ImportStyleRequest = ExportStyleResponse;
export interface GetVersionResponse { version: QrStyleVersionDto }
export interface PreviewStyleRequest { config: QrStyleConfig; payload?: string; format: "svg" | "png"; printSizeMm?: number; dpi?: number; transparent?: boolean }
export interface SampleTokensResponse { tokens: string[] }
