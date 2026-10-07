import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

function main() {
  const iconWhitePath = resolve(process.cwd(), "public/brand/su-icon-white@hd.png");
  const iconWhiteBuf = readFileSync(iconWhitePath);
  const base64 = iconWhiteBuf.toString("base64");

  const iconsDir = resolve(process.cwd(), "public/icons");
  mkdirSync(iconsDir, { recursive: true });

  const createSvg = (size: number) => `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#0F3056"/>
      <image href="data:image/png;base64,${base64}" x="${Math.round(size * 0.15)}" y="${Math.round(size * 0.15)}" width="${Math.round(size * 0.7)}" height="${Math.round(size * 0.7)}"/>
    </svg>
  `;

  for (const size of [192, 512]) {
    const svg = createSvg(size);
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: size },
    });
    const pngData = resvg.render().asPng();
    const destPath = resolve(iconsDir, `icon-${size}.png`);
    writeFileSync(destPath, pngData);
    console.log(`Generated ${destPath} (${size}x${size})`);
  }
}

main();
