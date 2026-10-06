import { randomBytes } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TOKEN = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{20}$/;
export function generateToken(): string {
  const bytes = randomBytes(13);
  let bits = 0, value = 0, result = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5 && result.length < 20) {
      bits -= 5;
      result += ALPHABET[(value >>> bits) & 31];
    }
    value &= (1 << bits) - 1;
  }
  return result;
}
export function formatSerial(n: number): string { return `SU-${String(n).padStart(6, "0")}`; }
export function buildQrPayload(token: string): string { return `NUSU1:${token}`; }
export function parseQrPayload(text: string): string | null {
  const input = text.trim();
  const code = /^NUSU1:([a-z0-9]+)$/i.exec(input);
  let candidate = code?.[1];
  if (!candidate) {
    try {
      const url = new URL(input);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.search && !url.hash)
        candidate = /^\/c\/([a-z0-9]+)\/?$/i.exec(url.pathname)?.[1];
    } catch { return null; }
  }
  const token = candidate?.toUpperCase();
  return token && TOKEN.test(token) ? token : null;
}
