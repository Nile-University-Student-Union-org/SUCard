import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { decryptRefreshToken, encryptRefreshToken } from "./credentials";

const state = vi.hoisted(() => ({ credential: null as null | Record<string, unknown> }));
vi.mock("@/lib/db", () => ({ db: { transaction: async (work: (tx: unknown) => Promise<unknown>) => work({
  select: () => ({ from: () => ({ where: () => ({ for: async () => [state.credential] }) }) }),
  update: () => ({ set: (changes: Record<string, unknown>) => ({ where: async () => { Object.assign(state.credential!, changes); } }) }),
}) } }));

beforeEach(() => {
  process.env.MAILER_TOKEN_KEY = randomBytes(32).toString("base64");
  process.env.MICROSOFT_TENANT_ID = "00000000-0000-4000-8000-000000000001";
  process.env.MICROSOFT_CLIENT_ID = "00000000-0000-4000-8000-000000000002";
  process.env.MICROSOFT_CLIENT_SECRET = "test-client-secret";
  const key = Buffer.from(process.env.MAILER_TOKEN_KEY, "base64");
  state.credential = { id: "graph", status: "connected", encryptedRefreshToken: encryptRefreshToken("first-refresh", key) };
});
afterEach(() => { vi.unstubAllGlobals(); delete process.env.MAILER_TOKEN_KEY; });

it("stores the rotated refresh token before returning an access token", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: "access", refresh_token: "rotated-refresh" }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const { graphAccessToken } = await import("./graph-sender");
  expect(await graphAccessToken()).toBe("access");
  expect(decryptRefreshToken(state.credential!.encryptedRefreshToken as string, Buffer.from(process.env.MAILER_TOKEN_KEY!, "base64"))).toBe("rotated-refresh");
  expect((fetchMock.mock.calls[0][1].body as URLSearchParams).get("refresh_token")).toBe("first-refresh");
});

it("disconnects and clears the token when Microsoft returns invalid_grant", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })));
  const { graphAccessToken, GraphDisconnectedError } = await import("./graph-sender");
  await expect(graphAccessToken()).rejects.toBeInstanceOf(GraphDisconnectedError);
  expect(state.credential).toMatchObject({ status: "disconnected", encryptedRefreshToken: null });
});
