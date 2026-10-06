import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { buildQrPayload, formatSerial, generateToken, parseQrPayload } from "./token";
import { createBatchSchema, exportOptionsSchema, parseExportOptions } from "./validation";
import { renderQrSvg } from "../qr-style/render";
import { svgToPng } from "../qr-style/png";

describe("tokens and payload", () => {
  it("generates 10,000 distinct 100-bit Crockford tokens", () => {
    const tokens = Array.from({ length: 10_000 }, generateToken);
    expect(new Set(tokens).size).toBe(tokens.length);
    for (const token of tokens) expect(token).toMatch(/^[0-9A-HJKMNP-TV-Z]{20}$/);
  });
  it("formats serials and parses both payload forms", () => {
    const token = generateToken();
    expect(formatSerial(123)).toBe("SU-000123");
    expect(parseQrPayload(` ${buildQrPayload(token).toLowerCase()} `)).toBe(token);
    expect(parseQrPayload(`https://example.org/c/${token.toLowerCase()}`)).toBe(token);
    for (const bad of ["junk", "NUSU1:OOOOOOOOOOOOOOOOOOOO", "https://example.org/c/short", "NUSU1:123?4"]) expect(parseQrPayload(bad)).toBeNull();
  });
});
describe("validation", () => {
  it("bounds batch inputs", () => {
    expect(createBatchSchema.parse({ label: "  Cards  ", count: 20_000 })).toEqual({ label: "Cards", count: 20_000 });
    for (const count of [0, 20_001, 1.5, "2"]) expect(createBatchSchema.safeParse({ label: "A", count }).success).toBe(false);
    expect(createBatchSchema.safeParse({ label: " ", count: 1 }).success).toBe(false);
    expect(createBatchSchema.safeParse({ label: "x".repeat(81), count: 1 }).success).toBe(false);
  });
  it("parses export flags and sizes", () => {
    expect(parseExportOptions(new URLSearchParams())).toEqual({ svg: true, png: false, pngSize: 1200 });
    expect(exportOptionsSchema.safeParse({ svg: "0", png: "0" }).success).toBe(false);
    expect(exportOptionsSchema.safeParse({ pngSize: "601" }).success).toBe(false);
  });
});
describe("QR renderer", () => {
  it("emits deterministic SVG with the QR module viewBox and icon", () => {
    const payload = buildQrPayload("0123456789ABCDEFGHJK");
    const n = QRCode.create(payload, { errorCorrectionLevel: "H" }).modules.size;
    const svg = renderQrSvg(payload);
    expect(svg).toContain(`viewBox="0 0 ${n + 4} ${n + 4}"`);
    expect(svg).toContain("<image ");
    expect(svg).toContain("data:image/png;base64,");
    expect(renderQrSvg(payload)).toBe(svg);
    const png = svgToPng(svg, 600);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(600);
  });
});
