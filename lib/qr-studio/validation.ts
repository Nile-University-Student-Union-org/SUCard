import { z } from "zod";
import { qrStyleConfigSchema, QR_PRESETS } from "@/lib/qr-style/config";
export const name = z.string().trim().min(1).max(80);
export const createStyleSchema = z.strictObject({ name, preset: z.enum(Object.keys(QR_PRESETS) as [keyof typeof QR_PRESETS, ...Array<keyof typeof QR_PRESETS>]).optional(), duplicateVersionId: z.uuid().optional(), config: qrStyleConfigSchema.optional() }).refine(v => [v.preset, v.duplicateVersionId, v.config].filter(Boolean).length <= 1);
export const updateStyleSchema = z.strictObject({ name: name.optional(), draftConfig: qrStyleConfigSchema.optional() }).refine(v => v.name !== undefined || v.draftConfig !== undefined);
export const publishStyleSchema = z.strictObject({ acceptWarningsReason: z.string().trim().min(5).max(500).optional() });
export const defaultStyleSchema = z.strictObject({ target: z.enum(["print", "web"]) });
export const importStyleSchema = z.strictObject({ schemaVersion: z.literal(1), name, config: qrStyleConfigSchema });
export const previewStyleSchema = z.strictObject({ config: qrStyleConfigSchema, payload: z.string().min(1).max(200).optional(), format: z.enum(["svg", "png"]), printSizeMm: z.number().min(5).max(200).optional(), dpi: z.number().int().min(300).max(1200).optional(), transparent: z.boolean().optional() });
