import { z } from "zod";

export const MAX_OFFER_IMAGE_BYTES = 2_500_000;
export class OfferImageError extends Error {}
const imageMime = z.enum(["image/png", "image/jpeg", "image/webp"], {
  error: "Image must be PNG, JPEG, or WebP",
});

function pngDimensions(bytes: Buffer) {
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || bytes.readUInt32BE(8) !== 13 || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegDimensions(bytes: Buffer) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  for (let offset = 2; offset + 4 <= bytes.length;) {
    if (bytes[offset] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda || offset + 2 > bytes.length) return null;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (length < 7) return null;
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  return null;
}

function webpDimensions(bytes: Buffer) {
  if (bytes.length < 30 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP" || bytes.readUInt32LE(4) + 8 !== bytes.length) return null;
  const kind = bytes.toString("ascii", 12, 16);
  if (kind === "VP8X") return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
  if (kind === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) return { width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]), height: 1 + ((bytes[24] & 0x0f) << 10 | bytes[23] << 2 | bytes[22] >> 6) };
  return null;
}

export function validateOfferImage(bytes: Buffer, declaredMime: string) {
  const mime = imageMime.parse(declaredMime);
  if (!bytes.length || bytes.length > MAX_OFFER_IMAGE_BYTES) throw new OfferImageError("Image must be at most 2.5 MB");
  const dimensions = mime === "image/png" ? pngDimensions(bytes) : mime === "image/jpeg" ? jpegDimensions(bytes) : webpDimensions(bytes);
  if (!dimensions || !dimensions.width || !dimensions.height) throw new OfferImageError("Invalid or truncated image data");
  const { width, height } = dimensions;
  if (width < 1080 || height < 1350 || width > 2160 || height > 2700) throw new OfferImageError("Image dimensions must be between 1080×1350 and 2160×2700");
  if (Math.abs(width / height / 0.8 - 1) > 0.01) throw new OfferImageError("Image must have a 4:5 portrait aspect ratio (±1%)");
  return { mime, width, height, size: bytes.length };
}

export function offerImageUrl(id: string, sha256: string | null): string | null {
  return sha256 ? `/api/offers/${id}/image?v=${sha256.slice(0, 8)}` : null;
}
