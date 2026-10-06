import QRCode from "qrcode";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface QrStyle { navy: string; background: string; dotScale: number; logoSize: number; quietZone: number }
export const NUSU_SIGNATURE: QrStyle = { navy: "#0F3056", background: "#FFFFFF", dotScale: 0.84, logoSize: 7, quietZone: 2 };
let iconData: string | undefined;
function icon(): string {
  return iconData ??= `data:image/png;base64,${readFileSync(join(process.cwd(), "public/brand/su-icon-qr.png")).toString("base64")}`;
}
export function renderQrSvg(payload: string, style: QrStyle = NUSU_SIGNATURE): string {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const n = qr.modules.size, q = style.quietZone, size = n + q * 2;
  const clear = 9, lo = Math.floor((n - clear) / 2), hi = lo + clear;
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}">`, `<rect width="${size}" height="${size}" fill="${style.background}"/>`];
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const eye = (row < 7 && (col < 7 || col >= n - 7)) || (row >= n - 7 && col < 7);
    if (!qr.modules.get(row, col) || eye || (row >= lo && row < hi && col >= lo && col < hi)) continue;
    parts.push(`<circle cx="${col + q + 0.5}" cy="${row + q + 0.5}" r="${style.dotScale / 2}" fill="${style.navy}"/>`);
  }
  for (const [row, col] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    const x = col + q, y = row + q;
    parts.push(`<rect x="${x}" y="${y}" width="7" height="7" rx="2.2" fill="${style.navy}"/>`,
      `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1.5" fill="${style.background}"/>`,
      `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.8" fill="${style.navy}"/>`);
  }
  const x = (size - style.logoSize) / 2;
  parts.push(`<image x="${x}" y="${x}" width="${style.logoSize}" height="${style.logoSize}" preserveAspectRatio="xMidYMid meet" href="${icon()}"/>`, "</svg>");
  return parts.join("");
}
