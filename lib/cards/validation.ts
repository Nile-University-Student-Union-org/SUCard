import { z } from "zod";
import { BATCH_COUNT_MAX, BATCH_LABEL_MAX } from "./types";

export const createBatchSchema = z.strictObject({
  label: z.string().trim().min(1).max(BATCH_LABEL_MAX),
  count: z.number().int().min(1).max(BATCH_COUNT_MAX),
  qrStyleVersionId: z.uuid().optional(),
});
const flag = z.enum(["0", "1"]).transform((v) => v === "1");
export const exportOptionsSchema = z.strictObject({
  svg: flag.default(true), png: flag.default(false),
  pngSize: z.enum(["600", "1200", "2400"]).default("1200").transform((v) => Number(v) as 600 | 1200 | 2400),
}).refine((v) => v.svg || v.png, "At least one of svg or png is required");

export function parseExportOptions(params: URLSearchParams) {
  const input: Record<string, string> = {};
  for (const [key, value] of params) input[key] = value;
  return exportOptionsSchema.parse(input);
}
