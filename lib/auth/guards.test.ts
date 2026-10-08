import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  current: { role: "admin", disabledAt: null as Date | null, email: "admin@nu.edu.eg", name: "Admin", twoFactorEnabled: true },
  loginMethod: "password",
  verified: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("./server", () => ({ auth: { api: { getSession: async () => ({ user: { id: "admin-id" },
  session: { id: "session-id", loginMethod: state.loginMethod } }) } } }));
vi.mock("@/lib/db", () => ({ db: { select: (fields: Record<string, unknown>) => ({ from: () => ({
  where: async () => "role" in fields ? [state.current] : state.verified ? [{ id: "verified" }] : [],
}) }) } }));

import { getAdminFromRequest } from "./guards";

const request = new Request("https://example.test/api/admin/cards");

describe("admin request access", () => {
  beforeEach(() => {
    state.current.role = "admin";
    state.current.disabledAt = null;
    state.current.twoFactorEnabled = true;
    state.loginMethod = "password";
    state.verified = false;
  });

  it("allows a password admin after Better Auth completes its factor challenge", async () => {
    expect((await getAdminFromRequest(request))?.role).toBe("admin");
  });

  it("requires a verified Microsoft session", async () => {
    state.loginMethod = "microsoft";
    expect(await getAdminFromRequest(request)).toBeNull();
    state.verified = true;
    expect((await getAdminFromRequest(request))?.role).toBe("admin");
  });

  it("denies a disabled or demoted user with an existing session", async () => {
    state.current.disabledAt = new Date();
    expect(await getAdminFromRequest(request)).toBeNull();
    state.current.disabledAt = null;
    state.current.role = "cashier";
    expect(await getAdminFromRequest(request)).toBeNull();
  });
});
