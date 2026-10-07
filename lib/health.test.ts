import { expect, it } from "vitest";
import { healthPayload } from "./health";
it("returns a minimal health shape", () => {
  const now = new Date("2026-10-07T00:00:00Z");
  expect(healthPayload(true, now)).toEqual({ ok: true, db: "ok", time: "2026-10-07T00:00:00.000Z" });
  expect(healthPayload(false, now).db).toBe("error");
});
