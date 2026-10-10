import { describe, expect, it } from "vitest";
import { validateOfferImage } from "./offer-image";

function png(width: number, height: number) {
  const bytes = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function jpeg(width: number, height: number) {
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 0, 0, 0, 0, 3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0]);
  bytes.writeUInt16BE(height, 7);
  bytes.writeUInt16BE(width, 9);
  return bytes;
}

function webp(width: number, height: number) {
  const bytes = Buffer.alloc(30);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(22, 4);
  bytes.write("WEBPVP8X", 8);
  bytes.writeUInt32LE(10, 16);
  bytes.writeUIntLE(width - 1, 24, 3);
  bytes.writeUIntLE(height - 1, 27, 3);
  return bytes;
}

describe("offer image validation", () => {
  it.each([
    ["image/png", png], ["image/jpeg", jpeg], ["image/webp", webp],
  ] as const)("reads %s dimensions from bytes", (mime, fixture) => {
    expect(validateOfferImage(fixture(1080, 1350), mime)).toMatchObject({ mime, width: 1080, height: 1350 });
  });

  it.each([
    ["too narrow", png(1079, 1350), "dimensions"],
    ["too large", png(2161, 2700), "dimensions"],
    ["wrong ratio", png(1080, 1400), "4:5"],
    ["wrong MIME", png(1080, 1350), "PNG, JPEG, or WebP", "image/gif"],
    ["wrong signature", Buffer.alloc(33), "Invalid or truncated"],
    ["too many bytes", Buffer.alloc(2_500_001), "2.5 MB"],
  ])("rejects %s", (_name, bytes, message, mime = "image/png") => {
    expect(() => validateOfferImage(bytes, mime)).toThrow(message);
  });
});
