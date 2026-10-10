import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptRefreshToken, encryptRefreshToken, mailerTokenKey } from "./credentials";
import { createOAuthFlow, matchesMailerAccount, verifyOAuthFlow } from "./microsoft";

afterEach(() => { delete process.env.MAILER_TOKEN_KEY; });

describe("mailer connection security", () => {
  it("encrypts refresh tokens with authenticated decryption", () => {
    const key = randomBytes(32);
    const encrypted = encryptRefreshToken("refresh-secret", key);
    expect(encrypted).not.toContain("refresh-secret");
    expect(decryptRefreshToken(encrypted, key)).toBe("refresh-secret");
    expect(() => decryptRefreshToken(encrypted, randomBytes(32))).toThrow();
  });

  it("disables Graph when the token key is missing or malformed", () => {
    expect(mailerTokenKey()).toBeNull();
    process.env.MAILER_TOKEN_KEY = Buffer.alloc(16).toString("base64");
    expect(mailerTokenKey()).toBeNull();
  });

  it("rejects a callback with mismatched state", () => {
    const redirect = "https://su-card.vercel.app/api/admin/mailer/microsoft/callback";
    const flow = createOAuthFlow(redirect, "signed-cookie-secret");
    expect(verifyOAuthFlow(flow.cookie, "wrong-state", "signed-cookie-secret", redirect)).toBeNull();
    expect(verifyOAuthFlow(flow.cookie, flow.state, "signed-cookie-secret", redirect)?.verifier).toBe(flow.verifier);
  });

  it("rejects the wrong Microsoft account before token storage", () => {
    expect(matchesMailerAccount({ mail: "other@nu.edu.eg", userPrincipalName: "other@nu.edu.eg" }, "su@nu.edu.eg")).toBe(false);
    expect(matchesMailerAccount({ mail: null, userPrincipalName: "SU@NU.EDU.EG" }, "su@nu.edu.eg")).toBe(true);
  });
});

const mailClaim = { id: crypto.randomUUID(), leaseId: crypto.randomUUID(), to: "student@example.com", subject: "Welcome", html: "<p>Hi</p>", createdAt: new Date() };
vi.mock("./delivery", () => ({ claimEmail: vi.fn(), acknowledgeEmail: vi.fn(), releaseEmail: vi.fn() }));
vi.mock("./graph-sender", () => ({ graphConnected: vi.fn(), sendGraphMail: vi.fn(), GraphDisconnectedError: class GraphDisconnectedError extends Error {} }));

describe("Graph outbox drain", () => {
  it("does not claim queued mail when Graph is disconnected", async () => {
    const delivery = await import("./delivery");
    const graph = await import("./graph-sender");
    const { drainOutbox } = await import("./drain");
    vi.mocked(delivery.claimEmail).mockClear();
    vi.mocked(graph.graphConnected).mockResolvedValue(false);
    expect(await drainOutbox()).toEqual({ sent: 0, failed: 0 });
    expect(delivery.claimEmail).not.toHaveBeenCalled();
  });

  it("marks successful sends and failed sends through the existing acknowledgement path", async () => {
    const delivery = await import("./delivery");
    const graph = await import("./graph-sender");
    const { drainOutbox } = await import("./drain");
    vi.mocked(graph.graphConnected).mockResolvedValue(true);
    vi.mocked(delivery.claimEmail).mockResolvedValue([mailClaim, { ...mailClaim, id: crypto.randomUUID(), leaseId: crypto.randomUUID() }]);
    vi.mocked(graph.sendGraphMail).mockResolvedValueOnce().mockRejectedValueOnce(new Error("Graph unavailable"));
    expect(await drainOutbox(2)).toEqual({ sent: 1, failed: 1 });
    expect(delivery.acknowledgeEmail).toHaveBeenNthCalledWith(1, mailClaim.id, mailClaim.leaseId, "sent");
    expect(delivery.acknowledgeEmail).toHaveBeenNthCalledWith(2, expect.any(String), expect.any(String), "failed");
  });
});
