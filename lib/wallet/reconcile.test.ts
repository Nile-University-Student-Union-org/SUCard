import { generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbState, homeState } = vi.hoisted(() => ({
  dbState: { pass: { objectId: "123456.student_student-1" }, userExists: true, synced: 0, attempted: 0, deleted: 0 },
  homeState: { status: "active", qr: "NUSU1:OLD" },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: (fields: Record<string, unknown>) => ({ from: () => ({ where: async () => fields.objectId ? [dbState.pass] : dbState.userExists ? [{ id: "student-1" }] : [] }) }),
    update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => {
      if (values.lastAttemptedAt) dbState.attempted++;
      if (values.lastSyncedAt) dbState.synced++;
    } }) }),
    delete: () => ({ where: async () => { dbState.deleted++; } }),
  },
}));
vi.mock("@/lib/student/service", () => ({ getStudentHome: async () => ({
  name: "Student", profile: { userId: "student-1", universityId: "231001001", status: homeState.status },
  card: homeState.qr ? { qr: homeState.qr } : null,
}) }));

import { syncGoogleWalletForStudent } from "./google";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const key = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

describe("issued Google pass reconciliation", () => {
  beforeEach(() => {
    process.env.GOOGLE_WALLET_ISSUER_ID = "123456";
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL = "wallet@example.com";
    process.env.GOOGLE_WALLET_KEY_JSON = Buffer.from(JSON.stringify({ client_email: "wallet@example.com", private_key: key })).toString("base64");
    process.env.PUBLIC_BASE_URL = "https://example.com";
    dbState.userExists = true;
    dbState.synced = 0;
    dbState.attempted = 0;
    dbState.deleted = 0;
    homeState.status = "active";
    homeState.qr = "NUSU1:OLD";
  });

  it("retries a failed Google patch and sends the current replacement QR", async () => {
    let patches = 0;
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      if (input.includes("oauth2")) return Response.json({ access_token: "token", expires_in: 3600 });
      patches++;
      return new Response(null, { status: patches === 1 ? 503 : 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await syncGoogleWalletForStudent("student-1")).toBe(false);
    expect(dbState.synced).toBe(0);
    homeState.qr = "NUSU1:REPLACEMENT";
    expect(await syncGoogleWalletForStudent("student-1")).toBe(true);
    expect(dbState.attempted).toBe(2);
    expect(dbState.synced).toBe(1);
    const payload = JSON.parse(fetchMock.mock.calls.at(-1)![1]!.body as string);
    expect(payload.barcode.value).toBe("NUSU1:REPLACEMENT");
    vi.unstubAllGlobals();
  });

  it.each(["suspended", "deleted"])("inactivates a %s student's issued pass", async (state) => {
    homeState.status = state;
    dbState.userExists = state !== "deleted";
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return input.includes("oauth2")
        ? Response.json({ access_token: "token", expires_in: 3600 })
        : new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await syncGoogleWalletForStudent("student-1")).toBe(true);
    const payload = JSON.parse(fetchMock.mock.calls.at(-1)![1]!.body as string);
    expect(payload.state).toBe("INACTIVE");
    expect(dbState.synced).toBe(state === "deleted" ? 0 : 1);
    expect(dbState.deleted).toBe(state === "deleted" ? 1 : 0);
    vi.unstubAllGlobals();
  });
});
