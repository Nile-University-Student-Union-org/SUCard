export function healthPayload(dbOk: boolean, now = new Date()) {
  return { ok: dbOk, db: dbOk ? "ok" : "error", time: now.toISOString() };
}
