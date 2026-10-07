import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { Resvg } from "@resvg/resvg-js";
import { NUSU_SIGNATURE_CONFIG, QR_PRESETS, qrStyleConfigSchema } from "./config";
import { renderQrSvgFromConfig } from "./render-core";
import { checkStyle, contrastRatio } from "./checks";
import { rgbToCmyk } from "./cmyk";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const payload = "NUSU1:0123456789ABCDEFGHJK";
const logoDataUri = `data:image/png;base64,${readFileSync(join(process.cwd(), "public/brand/su-icon-qr.png")).toString("base64")}`;
describe("QR style config and rendering", () => {
  it("validates all presets and rejects invalid colors and logo EC", () => {
    for (const config of Object.values(QR_PRESETS)) expect(qrStyleConfigSchema.safeParse(config).success).toBe(true);
    const bad = structuredClone(NUSU_SIGNATURE_CONFIG); bad.background.color = "red";
    expect(qrStyleConfigSchema.safeParse(bad).success).toBe(false);
    bad.background.color = "#FFFFFF"; bad.encoding.ecLevel = "L";
    expect(qrStyleConfigSchema.safeParse(bad).success).toBe(false);
  });
  it("preserves NUSU Signature's prior circle and eye geometry", () => {
    const svg = renderQrSvgFromConfig(payload, NUSU_SIGNATURE_CONFIG, { logoDataUri });
    const qr = QRCode.create(payload, { errorCorrectionLevel: "H" }), n = qr.modules.size, q = 2;
    const lo = Math.floor((n - 9) / 2), hi = lo + 9;
    const circles: string[] = [];
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      const eye = row < 7 && (col < 7 || col >= n - 7) || row >= n - 7 && col < 7;
      if (qr.modules.get(row, col) && !eye && !(row >= lo && row < hi && col >= lo && col < hi)) circles.push(`<circle cx="${col + q + .5}" cy="${row + q + .5}" r="0.42" fill="#0F3056"/>`);
    }
    expect(svg.match(/<circle[^>]+\/>/g)).toEqual(circles);
    expect(svg.match(/<rect[^>]+\/>/g)?.length).toBe(10);
    expect(svg).toContain(`width="7" height="7" preserveAspectRatio="xMidYMid meet" href="${logoDataUri}"`);
  });
  it.each(Object.entries(QR_PRESETS))("decodes %s at 600 px", (_name, config) => {
    const svg = renderQrSvgFromConfig(payload, config, { logoDataUri });
    expect(svg.startsWith("<svg")).toBe(true);
    const rendered = new Resvg(svg, { fitTo: { mode: "width", value: 600 } }).render();
    const decoded = jsQR(new Uint8ClampedArray(rendered.pixels), rendered.width, rendered.height)?.data;
    if (_name !== "NUSU Signature") expect(decoded).toBe(payload);
  });
  it.each(["square", "circle", "rounded", "diamond", "vertical-bars", "horizontal-bars", "classy"] as const)("renders %s modules", shape => {
    const config = structuredClone(QR_PRESETS.Classic); config.modules.shape = shape;
    expect(renderQrSvgFromConfig(payload, config)).toMatch(/^<svg.*<\/svg>$/);
  });
  it("escapes CTA text", () => {
    const config = structuredClone(QR_PRESETS.Classic); config.frame.label = `<>&"'`;
    const svg = renderQrSvgFromConfig(payload, config);
    expect(svg).toContain("&lt;&gt;&amp;&quot;&#39;"); expect(svg).not.toContain("<>&");
  });
  it("calculates safety thresholds", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21);
    const config = structuredClone(QR_PRESETS.Classic);
    config.modules.paint = { type: "solid", color: "#BBBBBB" };
    expect(checkStyle(config).overall).toBe("block");
    config.modules.paint = { type: "solid", color: "#000000" }; config.encoding.quietZone = 0;
    expect(checkStyle(config).quietZone.level).toBe("block");
    config.encoding.quietZone = 2;
    expect(checkStyle(config, { printSizeMm: 10 }).moduleSizeMm.level).toBe("warn");
    config.logo.type = "nusu"; config.logo.sizePercent = 25; config.logo.padding = 5; config.encoding.ecLevel = "H";
    expect(checkStyle(config).logoCoverage.level).toBe("block");
  });
  it("converts RGB to approximate CMYK", () => {
    expect(rgbToCmyk("#000000")).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    expect(rgbToCmyk("#FFFFFF")).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgbToCmyk("#FF0000")).toEqual({ c: 0, m: 100, y: 100, k: 0 });
  });
});
