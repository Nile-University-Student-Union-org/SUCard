import QRCode from "qrcode";
import type { QrStyleConfig } from "./config";

export interface QrAssets { logoDataUri?: string }
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const validLogo = (uri?: string) => uri?.match(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/) ? uri : undefined;
function shape(kind: string, x: number, y: number, size: number, fill: string, radius = 0, rotation = 0): string {
  const transform = rotation ? ` transform="rotate(${rotation} ${x + size / 2} ${y + size / 2})"` : "";
  if (kind === "circle") return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${fill}"${transform}/>`;
  if (kind === "diamond") return `<path d="M ${x + size / 2} ${y} L ${x + size} ${y + size / 2} L ${x + size / 2} ${y + size} L ${x} ${y + size / 2} Z" fill="${fill}"${transform}/>`;
  if (kind === "leaf") return `<path d="M ${x} ${y} Q ${x + size} ${y} ${x + size} ${y + size} Q ${x} ${y + size} ${x} ${y} Z" fill="${fill}"${transform}/>`;
  if (kind === "cushion") return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.34}" fill="${fill}"${transform}/>`;
  if (kind === "classy") return `<path d="M ${x + size * .25} ${y} H ${x + size} V ${y + size} H ${x} V ${y + size * .25} Q ${x} ${y} ${x + size * .25} ${y} Z" fill="${fill}"/>`;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}"${kind === "rounded" ? ` rx="${radius}"` : ""} fill="${fill}"${transform}/>`;
}
export function renderQrSvgFromConfig(payload: string, config: QrStyleConfig, assets: QrAssets = {}): string {
  const { encoding, modules, eyes, background, logo, frame } = config;
  const qr = QRCode.create(payload, { errorCorrectionLevel: logo.type === "none" ? encoding.ecLevel : "H", ...(encoding.version === null ? {} : { version: encoding.version }), ...(encoding.mask === null ? {} : { maskPattern: encoding.mask as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }) });
  const n = qr.modules.size, q = encoding.quietZone, size = n + q * 2;
  const legacy = logo.type === "nusu" && logo.legacySignature;
  const logoSize = legacy ? 7 : n * logo.sizePercent / 100;
  const clearSize = legacy ? 9 : logoSize + logo.padding * 2;
  const clearLo = legacy ? Math.floor((n - 9) / 2) : (n - clearSize) / 2;
  const clearHi = clearLo + clearSize;
  const fg = modules.paint.type === "solid" ? modules.paint.color : "url(#module-paint)";
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}">`];
  if (modules.paint.type !== "solid") {
    const stops = modules.paint.stops.map(s => `<stop offset="${s.offset * 100}%" stop-color="${s.color}"/>`).join("");
    parts.push(modules.paint.type === "linear" ? `<defs><linearGradient id="module-paint" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size * Math.cos(modules.paint.angle * Math.PI / 180)}" y2="${size * Math.sin(modules.paint.angle * Math.PI / 180)}">${stops}</linearGradient></defs>` : `<defs><radialGradient id="module-paint">${stops}</radialGradient></defs>`);
  }
  if (background.type === "solid") parts.push(`<rect width="${size}" height="${size}" fill="${background.color}"/>`);
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const eye = (row < 7 && (col < 7 || col >= n - 7)) || (row >= n - 7 && col < 7);
    if (!qr.modules.get(row, col) || eye) continue;
    if (logo.type !== "none" && row + 1 > clearLo && row < clearHi && col + 1 > clearLo && col < clearHi) continue;
    const s = modules.scale, x = col + q + (1 - s) / 2, y = row + q + (1 - s) / 2;
    if (modules.shape === "vertical-bars") parts.push(shape("rounded", x + s * .22, y, s * .56, fg, s * .2));
    else if (modules.shape === "horizontal-bars") parts.push(`<rect x="${x}" y="${y + s * .22}" width="${s}" height="${s * .56}" rx="${s * .1}" fill="${fg}"/>`);
    else parts.push(shape(modules.shape, x, y, s, fg, modules.radius * s));
  }
  for (const [key, row, col] of [["topLeft", 0, 0], ["topRight", 0, n - 7], ["bottomLeft", n - 7, 0]] as const) {
    const eye = eyes[key], x = col + q, y = row + q;
    if (legacy) {
      parts.push(`<rect x="${x}" y="${y}" width="7" height="7" rx="2.2" fill="${eye.frameColor}"/>`, `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1.5" fill="${background.color}"/>`, `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.8" fill="${eye.pupilColor}"/>`);
    } else {
      parts.push(shape(eye.frameShape, x, y, 7, eye.frameColor, eye.frameRadius, eye.rotation));
      parts.push(shape(eye.frameShape, x + 1, y + 1, 5, background.type === "solid" ? background.color : "#FFFFFF", Math.max(0, eye.frameRadius - .7), eye.rotation));
      parts.push(shape(eye.pupilShape, x + 2, y + 2, 3, eye.pupilColor, .8, eye.rotation));
    }
  }
  if (logo.type === "nusu") {
    const x = (size - logoSize) / 2;
    if (logo.plate !== "none") parts.push(shape(logo.plate === "circle" ? "circle" : "rounded", (size - clearSize) / 2, (size - clearSize) / 2, clearSize, logo.plateColor, clearSize * .2));
    const uri = validLogo(assets.logoDataUri);
    if (uri) parts.push(`<image x="${x}" y="${x}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" href="${uri}"/>`);
  }
  if (frame.shape !== "none") parts.push(`<rect x="${q / 2}" y="${q / 2}" width="${size - q}" height="${size - q}" rx="${frame.shape === "pill" ? size / 2 : frame.shape === "rounded" ? 2 : 0}" stroke="${frame.color}" stroke-width="${frame.width}" fill="none"/>`);
  if (frame.label) {
    const y = frame.position === "top" ? Math.max(1, q / 2) : size - Math.max(0.2, q / 2);
    if (frame.badgeColor) parts.push(`<rect x="${size * .15}" y="${y - 1}" width="${size * .7}" height="1.4" rx=".3" fill="${frame.badgeColor}"/>`);
    parts.push(`<text x="${size / 2}" y="${y}" text-anchor="middle" font-family="${frame.font === "anton" ? "Anton" : "Poppins"}" font-size=".8" fill="${frame.labelColor}">${escape(frame.label)}</text>`);
  }
  parts.push("</svg>"); return parts.join("");
}
