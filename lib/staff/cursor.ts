import { z } from "zod";

const payload = z.strictObject({ createdAt: z.iso.datetime({ offset: true }), id: z.uuid() });
export type AuditCursor = z.infer<typeof payload>;

export function encodeAuditCursor(cursor: AuditCursor): string {
  return Buffer.from(JSON.stringify(payload.parse(cursor))).toString("base64url");
}

export function decodeAuditCursor(value: string): AuditCursor {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 512) throw new Error("Invalid audit cursor");
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const result = payload.parse(JSON.parse(decoded));
    if (encodeAuditCursor(result) !== value) throw new Error("Invalid audit cursor");
    return result;
  } catch { throw new Error("Invalid audit cursor"); }
}
