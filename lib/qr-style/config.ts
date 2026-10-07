import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/);
const stop = z.strictObject({ offset: z.number().min(0).max(1), color });
export const paintSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("solid"), color }),
  z.strictObject({ type: z.literal("linear"), angle: z.number().min(0).max(360), stops: z.array(stop).min(2).max(5) }),
  z.strictObject({ type: z.literal("radial"), stops: z.array(stop).min(2).max(5) }),
]);
const eye = z.strictObject({
  frameShape: z.enum(["square", "rounded", "circle", "leaf", "cushion"]),
  frameRadius: z.number().min(0).max(3.5), frameColor: color,
  pupilShape: z.enum(["square", "rounded", "circle", "diamond", "leaf"]),
  pupilColor: color, rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
});
const defaultEye = { frameShape: "rounded", frameRadius: 2.2, frameColor: "#0F3056", pupilShape: "rounded", pupilColor: "#0F3056", rotation: 0 } as const;
export const qrStyleConfigSchema = z.strictObject({
  schemaVersion: z.literal(1),
  encoding: z.strictObject({ ecLevel: z.enum(["L", "M", "Q", "H"]), version: z.number().int().min(1).max(40).nullable(), mask: z.number().int().min(0).max(7).nullable(), quietZone: z.number().int().min(0).max(8) }),
  modules: z.strictObject({ shape: z.enum(["square", "circle", "rounded", "diamond", "vertical-bars", "horizontal-bars", "classy"]), scale: z.number().min(0.5).max(1), radius: z.number().min(0).max(0.5), paint: paintSchema }),
  eyes: z.strictObject({ topLeft: eye, topRight: eye, bottomLeft: eye }),
  background: z.strictObject({ type: z.enum(["solid", "transparent"]), color }),
  logo: z.strictObject({ type: z.enum(["none", "nusu"]), sizePercent: z.number().min(0).max(25), padding: z.number().min(0).max(5), plate: z.enum(["none", "circle", "rounded-square"]), plateColor: color, clear: z.enum(["square", "plate"]), legacySignature: z.boolean().optional() }),
  frame: z.strictObject({ shape: z.enum(["none", "square", "rounded", "pill"]), color, width: z.number().min(0).max(4), label: z.string().max(24), font: z.enum(["anton", "poppins"]), labelColor: color, position: z.enum(["top", "bottom"]), badgeColor: color.nullable() }),
  output: z.strictObject({ printSizeMm: z.number().min(5).max(200), dpi: z.number().int().min(300).max(1200) }),
}).superRefine((value, ctx) => {
  if (value.logo.type !== "none" && value.encoding.ecLevel !== "H") ctx.addIssue({ code: "custom", path: ["encoding", "ecLevel"], message: "A logo requires error correction H" });
  if (value.modules.paint.type !== "solid") {
    const offsets = value.modules.paint.stops.map(s => s.offset);
    if (offsets[0] !== 0 || offsets.at(-1) !== 1 || offsets.some((v, i) => i > 0 && v <= offsets[i - 1])) ctx.addIssue({ code: "custom", path: ["modules", "paint", "stops"], message: "Gradient stops must increase from 0 to 1" });
  }
});
export type QrStyleConfig = z.infer<typeof qrStyleConfigSchema>;
const solid = (hex: string) => ({ type: "solid" as const, color: hex });
export const NUSU_SIGNATURE_CONFIG: QrStyleConfig = {
  schemaVersion: 1, encoding: { ecLevel: "H", version: null, mask: null, quietZone: 2 },
  modules: { shape: "circle", scale: 0.84, radius: 0.2, paint: solid("#0F3056") },
  eyes: { topLeft: defaultEye, topRight: defaultEye, bottomLeft: defaultEye },
  background: { type: "solid", color: "#FFFFFF" },
  logo: { type: "nusu", sizePercent: 0, padding: 0, plate: "none", plateColor: "#FFFFFF", clear: "square", legacySignature: true },
  frame: { shape: "none", color: "#0F3056", width: 0, label: "", font: "anton", labelColor: "#0F3056", position: "bottom", badgeColor: null },
  output: { printSizeMm: 25, dpi: 600 },
};
const clone = () => structuredClone(NUSU_SIGNATURE_CONFIG);
const classic = clone(); classic.encoding.ecLevel = "M"; classic.modules = { ...classic.modules, shape: "square", scale: 1, paint: solid("#000000") }; classic.logo.type = "none"; classic.logo.legacySignature = false; classic.eyes = Object.fromEntries(Object.entries(classic.eyes).map(([k]) => [k, { ...defaultEye, frameShape: "square", pupilShape: "square", frameColor: "#000000", pupilColor: "#000000" }])) as QrStyleConfig["eyes"];
const minimal = structuredClone(classic); minimal.modules.scale = 0.9; minimal.modules.shape = "rounded";
const bold = structuredClone(classic); bold.modules.scale = 1; bold.eyes = Object.fromEntries(Object.entries(bold.eyes).map(([k, v]) => [k, { ...v, frameShape: "circle", pupilShape: "circle" }])) as QrStyleConfig["eyes"];
const gradient = structuredClone(classic); gradient.modules.paint = { type: "linear", angle: 45, stops: [{ offset: 0, color: "#0F3056" }, { offset: 1, color: "#018BCE" }] };
export const QR_PRESETS = { Classic: classic, "NUSU Signature": NUSU_SIGNATURE_CONFIG, Minimal: minimal, Bold: bold, Gradient: gradient } satisfies Record<string, QrStyleConfig>;
