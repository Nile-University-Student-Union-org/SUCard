import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NUSU_SIGNATURE_CONFIG } from "./config";
import { renderQrSvgFromConfig } from "./render-core";

export interface QrStyle { navy: string; background: string; dotScale: number; logoSize: number; quietZone: number }
export const NUSU_SIGNATURE: QrStyle = { navy: "#0F3056", background: "#FFFFFF", dotScale: 0.84, logoSize: 7, quietZone: 2 };
let iconData: string | undefined;
export function nusuLogoDataUri(): string {
  return iconData ??= `data:image/png;base64,${readFileSync(join(process.cwd(), "public/brand/su-icon-qr.png")).toString("base64")}`;
}
export function renderQrSvg(payload: string, style: QrStyle = NUSU_SIGNATURE): string {
  const config = structuredClone(NUSU_SIGNATURE_CONFIG);
  config.modules.paint = { type: "solid", color: style.navy };
  config.modules.scale = style.dotScale;
  config.encoding.quietZone = style.quietZone;
  config.background.color = style.background;
  config.logo.sizePercent = style.logoSize;
  for (const eye of Object.values(config.eyes)) { eye.frameColor = style.navy; eye.pupilColor = style.navy; }
  return renderQrSvgFromConfig(payload, config, { logoDataUri: nusuLogoDataUri() });
}
