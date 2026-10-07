import type { QrStyleConfig } from "./config";
export type CheckLevel = "ok" | "warn" | "block";
export interface CheckResult {
  contrast: { color: string; ratio: number; level: CheckLevel }[];
  logoCoverage: { percent: number; safeLimit: number; level: CheckLevel };
  moduleSizeMm: { value: number; level: CheckLevel };
  quietZone: { value: number; level: CheckLevel };
  eyesIntact: { value: boolean; level: CheckLevel };
  overall: CheckLevel;
}
const rank = { ok: 0, warn: 1, block: 2 };
function luminance(hex: string) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
export function contrastRatio(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
export function checkStyle(config: QrStyleConfig, { printSizeMm = config.output.printSizeMm, sampleVersion = config.encoding.version ?? 3 }: { printSizeMm?: number; sampleVersion?: number } = {}): CheckResult {
  const bg = config.background.type === "solid" ? config.background.color : "#FFFFFF";
  const colors = config.modules.paint.type === "solid" ? [config.modules.paint.color] : config.modules.paint.stops.map(s => s.color);
  colors.push(...Object.values(config.eyes).flatMap(e => [e.frameColor, e.pupilColor]));
  const contrast = [...new Set(colors)].map(color => {
    const ratio = contrastRatio(color, bg);
    return { color, ratio, level: ratio < 3 ? "block" : ratio < 4.5 || luminance(color) > luminance(bg) ? "warn" : "ok" } as const;
  });
  const n = 17 + sampleVersion * 4, q = config.encoding.quietZone;
  const width = config.logo.type === "none" ? 0 : config.logo.legacySignature ? 9 : n * config.logo.sizePercent / 100 + config.logo.padding * 2;
  const percent = width * width / (n * n) * 100;
  const recoverable = { L: 7, M: 15, Q: 25, H: 30 }[config.encoding.ecLevel];
  const safeLimit = recoverable * .6;
  const logoCoverage = { percent, safeLimit, level: percent > safeLimit ? "block" : percent > 15 ? "warn" : "ok" } as const;
  const moduleSize = printSizeMm / (n + q * 2);
  const moduleSizeMm = { value: moduleSize, level: moduleSize < .5 ? "warn" : "ok" } as const;
  const quietZone = { value: q, level: q === 0 ? "block" : q < 2 ? "warn" : "ok" } as const;
  const eyesClear = width <= n - 14;
  const eyesIntact = { value: eyesClear, level: eyesClear ? "ok" : "block" } as const;
  const levels = [...contrast.map(c => c.level), logoCoverage.level, moduleSizeMm.level, quietZone.level, eyesIntact.level];
  return { contrast, logoCoverage, moduleSizeMm, quietZone, eyesIntact, overall: levels.reduce<CheckLevel>((a, b) => rank[b] > rank[a] ? b : a, "ok") };
}
