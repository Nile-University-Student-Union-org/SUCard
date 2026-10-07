import * as THREE from "three";
import QRCode from "qrcode";
import { CARD_ART } from "./card-art";

/** Card face texture size, matching the card artwork in public/card (1.37 : 1). */
export const CARD_TEX_W = 2560;
export const CARD_TEX_H = 1868;

/** Slot punched near the top edge of the card, in texture pixels (kept clear of artwork). */
export const SLOT = { cx: CARD_TEX_W / 2, cy: 108, w: 400, h: 72 };

const NAVY = "#0F3056";
const BLUE = "#0F548D";
const SKY = "#018BCE";

function fontFamily(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(text, x, y);
  ctx.letterSpacing = "0px";
}

function makeTexture(canvas: HTMLCanvasElement, maxAnisotropy: number) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function canvasOf(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function paintBase(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#0A2342");
  bg.addColorStop(0.55, NAVY);
  bg.addColorStop(1, "#123E6E");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.82, h * 0.1, 0, w * 0.82, h * 0.1, w * 0.62);
  glow.addColorStop(0, "rgba(1,139,206,0.42)");
  glow.addColorStop(0.5, "rgba(1,139,206,0.12)");
  glow.addColorStop(1, "rgba(1,139,206,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const low = ctx.createRadialGradient(w * 0.05, h * 1.05, 0, w * 0.05, h * 1.05, w * 0.5);
  low.addColorStop(0, "rgba(15,84,141,0.55)");
  low.addColorStop(1, "rgba(15,84,141,0)");
  ctx.fillStyle = low;
  ctx.fillRect(0, 0, w, h);

  // Fine guilloche lines
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 2;
  for (let i = -6; i < 30; i++) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const y = i * 64 + Math.sin(x / 210 + i * 0.35) * 38 + x * 0.18;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function paintQr(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const quiet = 2;
  const cell = size / (n + quiet * 2);
  const ox = x + quiet * cell;
  const oy = y + quiet * cell;
  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, x, y, size, size, cell * 1.6);
  ctx.fill();

  ctx.fillStyle = NAVY;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.get(r, c) || isFinder(r, c)) continue;
      roundRect(ctx, ox + c * cell + cell * 0.06, oy + r * cell + cell * 0.06, cell * 0.88, cell * 0.88, cell * 0.32);
      ctx.fill();
    }
  }
  for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]] as const) {
    const fx = ox + c * cell;
    const fy = oy + r * cell;
    ctx.fillStyle = NAVY;
    roundRect(ctx, fx, fy, cell * 7, cell * 7, cell * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, fx + cell, fy + cell, cell * 5, cell * 5, cell * 1.4);
    ctx.fill();
    ctx.fillStyle = SKY;
    roundRect(ctx, fx + cell * 2, fy + cell * 2, cell * 3, cell * 3, cell * 0.9);
    ctx.fill();
  }
}

async function paintFront(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, icon: HTMLImageElement | null) {
  const w = CARD_TEX_W;
  const h = CARD_TEX_H;
  const heading = fontFamily("--font-heading", "Impact, sans-serif");
  const sans = fontFamily("--font-sans", "system-ui, sans-serif");
  paintBase(ctx, w, h);

  // Big watermark icon on the right
  if (icon) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    const ih = h * 1.05;
    const iw = (icon.width / icon.height) * ih;
    ctx.drawImage(icon, w - iw * 0.78, h - ih * 0.92, iw, ih);
    ctx.restore();
  }

  // Holographic foil strip on the left edge
  const foil = ctx.createLinearGradient(0, 0, 0, h);
  ["#7FD8FF", "#B9A6FF", "#FF9FD6", "#FFE29A", "#9DFFCB", "#7FD8FF"].forEach((c, i, a) => foil.addColorStop(i / (a.length - 1), c));
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = foil;
  ctx.fillRect(120, 0, 26, h);
  ctx.globalAlpha = 0.35;
  ctx.fillRect(160, 0, 6, h);
  ctx.restore();

  const left = 240;

  // Logo
  if (logo) {
    const lh = 150;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, left, 210, lw, lh);
  }

  // Title
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 360px ${heading}`;
  spacedText(ctx, "SU CARD", left - 8, 860, 14);

  // Subtitle
  ctx.font = `600 54px ${sans}`;
  ctx.fillStyle = "#A9CDEB";
  spacedText(ctx, "NILE UNIVERSITY STUDENT UNION", left, 970, 7);

  // Student pill
  ctx.font = `700 50px ${sans}`;
  const pillText = "STUDENT";
  ctx.letterSpacing = "10px";
  const pw = ctx.measureText(pillText).width + 96;
  ctx.letterSpacing = "0px";
  const py = 1190;
  ctx.fillStyle = SKY;
  roundRect(ctx, left, py, pw, 104, 52);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  spacedText(ctx, pillText, left + 48, py + 55, 10);

  ctx.textBaseline = "alphabetic";
  ctx.font = `500 44px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  spacedText(ctx, "Show at partner stores to save", left, 1440, 1);

  // QR
  const qrSize = 640;
  const qx = w - qrSize - 200;
  const qy = 470;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, qx, qy, qrSize, qrSize, 48);
  ctx.fill();
  ctx.restore();
  paintQr(ctx, "NUSU1:DEMO0000000000000000", qx, qy, qrSize);

  ctx.font = `600 40px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  spacedText(ctx, "SCAN AT CHECKOUT", qx + qrSize / 2, qy + qrSize + 90, 6);
  ctx.textAlign = "left";

  // Bottom sky accent line
  const line = ctx.createLinearGradient(0, 0, w, 0);
  line.addColorStop(0, "rgba(1,139,206,0)");
  line.addColorStop(0.3, SKY);
  line.addColorStop(1, BLUE);
  ctx.fillStyle = line;
  ctx.fillRect(0, h - 22, w, 22);
}

function paintBack(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, logo: HTMLImageElement | null) {
  const w = CARD_TEX_W;
  const h = CARD_TEX_H;
  const heading = fontFamily("--font-heading", "Impact, sans-serif");
  const sans = fontFamily("--font-sans", "system-ui, sans-serif");
  paintBase(ctx, w, h);

  // Icon pattern
  if (icon) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    const s = 150;
    const iw = (icon.width / icon.height) * s;
    for (let row = 0; row * 230 < h + 230; row++) {
      for (let col = -1; col * 260 < w + 260; col++) {
        ctx.drawImage(icon, col * 260 + (row % 2) * 130, row * 230 + 40, iw, s);
      }
    }
    ctx.restore();
  }

  if (logo) {
    const lh = 230;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, (w - lw) / 2, 470, lw, lh);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `400 150px ${heading}`;
  spacedText(ctx, "SHOW. SCAN. SAVE.", w / 2, 960, 10);

  ctx.font = `500 50px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  spacedText(ctx, "Present this card at participating partners.", w / 2, 1080, 0);
  ctx.font = `500 40px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  spacedText(ctx, "If found, please return it to the NUSU office.", w / 2, 1400, 0);
  ctx.textAlign = "left";

  ctx.fillStyle = SKY;
  ctx.fillRect(0, h - 22, w, 22);
}

export const STRAP_TEX_W = 2048;
export const STRAP_TEX_H = 640;

function paintStrap(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null) {
  const w = STRAP_TEX_W;
  const h = STRAP_TEX_H;
  const heading = fontFamily("--font-heading", "Impact, sans-serif");

  // Body: navy, slightly lighter down the middle so the ribbon reads as rounded fabric.
  const body = ctx.createLinearGradient(0, 0, 0, h);
  body.addColorStop(0, "#0A2240");
  body.addColorStop(0.5, "#123A66");
  body.addColorStop(1, "#0A2240");
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, w, h);

  // Twill weave: fine diagonal threads.
  ctx.save();
  ctx.lineWidth = 2;
  for (let x = -h; x < w + h; x += 9) {
    ctx.strokeStyle = (x / 9) % 2 === 0 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.10)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h * 0.35, h);
    ctx.stroke();
  }
  ctx.restore();

  // Edges: slightly darker selvedge with a woven-in sky stripe and a stitch line.
  const edge = ctx.createLinearGradient(0, 0, 0, h);
  edge.addColorStop(0, "rgba(0,0,0,0.38)");
  edge.addColorStop(0.07, "rgba(0,0,0,0)");
  edge.addColorStop(0.93, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(1,139,206,0.9)";
  ctx.fillRect(0, 34, w, 22);
  ctx.fillRect(0, h - 56, w, 22);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  for (let x = 0; x < w; x += 28) {
    ctx.fillRect(x, 74, 16, 3);
    ctx.fillRect(x, h - 77, 16, 3);
  }

  // Artwork: SU icon · NUSU · SU icon · NUSU, evenly spaced so the tile repeats seamlessly.
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `400 270px ${heading}`;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  const slot = w / 4;
  for (let i = 0; i < 4; i++) {
    const cx = slot * i + slot / 2;
    if (i % 2 === 0) {
      if (icon) {
        const ih = 250;
        const iw = (icon.width / icon.height) * ih;
        ctx.drawImage(icon, cx - iw / 2, h / 2 - ih / 2, iw, ih);
      }
    } else {
      ctx.letterSpacing = "24px";
      ctx.fillText("NUSU", cx + 12, h / 2 + 10);
      ctx.letterSpacing = "0px";
    }
  }
  ctx.shadowColor = "transparent";
  ctx.textAlign = "left";
}

/** Draws an artist-supplied PNG over the whole face (stretched to the card ratio). */
function paintArt(ctx: CanvasRenderingContext2D, art: HTMLImageElement) {
  ctx.drawImage(art, 0, 0, CARD_TEX_W, CARD_TEX_H);
}

export type CardTextures = {
  front: THREE.CanvasTexture;
  back: THREE.CanvasTexture;
  strap: THREE.CanvasTexture;
  /** Resolves once fonts, logos and artwork are painted in. */
  ready: Promise<void>;
  dispose: () => void;
};

/**
 * Creates the card front/back and strap textures. They are returned immediately
 * (plain navy) and repainted once fonts and logos have loaded.
 */
export function createCardTextures(maxAnisotropy: number): CardTextures {
  const front = canvasOf(CARD_TEX_W, CARD_TEX_H);
  const back = canvasOf(CARD_TEX_W, CARD_TEX_H);
  const strap = canvasOf(STRAP_TEX_W, STRAP_TEX_H);
  paintBase(front.ctx, CARD_TEX_W, CARD_TEX_H);
  paintBase(back.ctx, CARD_TEX_W, CARD_TEX_H);
  strap.ctx.fillStyle = NAVY;
  strap.ctx.fillRect(0, 0, STRAP_TEX_W, STRAP_TEX_H);

  const textures = {
    front: makeTexture(front.canvas, maxAnisotropy),
    back: makeTexture(back.canvas, maxAnisotropy),
    strap: makeTexture(strap.canvas, maxAnisotropy),
  };
  textures.strap.wrapS = THREE.RepeatWrapping;
  textures.strap.wrapT = THREE.RepeatWrapping;

  let disposed = false;
  const ready = (async () => {
    const heading = fontFamily("--font-heading", "Impact");
    const sans = fontFamily("--font-sans", "sans-serif");
    const [logo, icon, frontArt, backArt] = await Promise.all([
      loadImage("/brand/su-logo-white@hd.png"),
      loadImage("/brand/su-icon-white@hd.png"),
      CARD_ART.front ? loadImage(CARD_ART.front) : null,
      CARD_ART.back ? loadImage(CARD_ART.back) : null,
      document.fonts.load(`400 100px ${heading}`).catch(() => null),
      document.fonts.load(`600 100px ${sans}`).catch(() => null),
      document.fonts.load(`700 100px ${sans}`).catch(() => null),
      document.fonts.load(`500 100px ${sans}`).catch(() => null),
    ]);
    if (disposed) return;
    if (frontArt) paintArt(front.ctx, frontArt);
    else await paintFront(front.ctx, logo, icon);
    if (backArt) paintArt(back.ctx, backArt);
    else paintBack(back.ctx, icon, logo);
    paintStrap(strap.ctx, icon);
    textures.front.needsUpdate = true;
    textures.back.needsUpdate = true;
    textures.strap.needsUpdate = true;
  })();

  return {
    ...textures,
    ready,
    dispose: () => {
      disposed = true;
      textures.front.dispose();
      textures.back.dispose();
      textures.strap.dispose();
    },
  };
}
