import { beforeEach, describe, expect, it, vi } from "vitest";

const { reconcile } = vi.hoisted(() => ({ reconcile: vi.fn(async () => ({ attempted: 1, succeeded: 1, failed: 0 })) }));
vi.mock("@/lib/wallet/reconcile", () => ({ reconcileGoogleWalletPasses: reconcile }));

import { GET } from "./route";

describe("wallet reconciliation cron route", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "a-secret-with-at-least-thirty-two-characters";
    reconcile.mockClear();
  });

  it("rejects an unauthorized invocation", async () => {
    const response = await GET(new Request("https://example.com/api/student/wallet/reconcile"));
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(reconcile).not.toHaveBeenCalled();
  });

  it("runs reconciliation with the cron bearer secret", async () => {
    const response = await GET(new Request("https://example.com/api/student/wallet/reconcile", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ attempted: 1, succeeded: 1, failed: 0 });
    expect(reconcile).toHaveBeenCalledOnce();
  });
});
