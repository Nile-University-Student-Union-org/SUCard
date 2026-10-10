import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";

const keySchema = z.base64().transform((encoded) => Buffer.from(encoded, "base64"))
  .refine((key) => key.length === 32, "MAILER_TOKEN_KEY must contain 32 bytes");

export function mailerTokenKey(): Buffer | null {
  const parsed = keySchema.safeParse(process.env.MAILER_TOKEN_KEY);
  return parsed.success ? parsed.data : null;
}

export function encryptRefreshToken(token: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

export function decryptRefreshToken(encoded: string, key: Buffer): string {
  const payload = Buffer.from(encoded, "base64");
  if (payload.length < 29) throw new Error("Invalid encrypted refresh token");
  const decipher = createDecipheriv("aes-256-gcm", key, payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8");
}
