import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { createOAuthFlow } from "@/lib/email/microsoft";

const transaction = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/guards", () => ({ getAdminFromRequest: vi.fn().mockResolvedValue({ id: "admin", role: "super_admin" }) }));
vi.mock("@/lib/db", () => ({ db: { transaction } }));

const redirectUri = "http://localhost:3000/api/admin/mailer/microsoft/callback";
beforeEach(() => {
  transaction.mockClear();
  process.env.BETTER_AUTH_SECRET = "a-test-secret-longer-than-thirty-two-characters";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.MAILER_TOKEN_KEY = randomBytes(32).toString("base64");
  process.env.MICROSOFT_TENANT_ID = "00000000-0000-4000-8000-000000000001";
  process.env.MICROSOFT_CLIENT_ID = "00000000-0000-4000-8000-000000000002";
  process.env.MICROSOFT_CLIENT_SECRET = "test-secret";
});

function callbackRequest(cookie: string, state: string) {
  return new NextRequest(`${redirectUri}?code=test-code&state=${state}`, { headers: { cookie: `mailer_oauth=${cookie}` } });
}

it("rejects a callback with a mismatched state before exchanging the code", async () => {
  const flow = createOAuthFlow(redirectUri, process.env.BETTER_AUTH_SECRET!);
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const { GET } = await import("./route");
  const response = await GET(callbackRequest(flow.cookie, "different-state"));
  expect(response.headers.get("location")).toContain("mailer=state");
  expect(fetchMock).not.toHaveBeenCalled();
  expect(transaction).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

it("rejects the wrong Microsoft account without storing its refresh token", async () => {
  const flow = createOAuthFlow(redirectUri, process.env.BETTER_AUTH_SECRET!);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh" }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ mail: "other@nu.edu.eg", userPrincipalName: "other@nu.edu.eg" }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const { GET } = await import("./route");
  const response = await GET(callbackRequest(flow.cookie, flow.state));
  expect(response.headers.get("location")).toContain("mailer=account");
  expect(transaction).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
