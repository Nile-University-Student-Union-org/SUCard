import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("page CSP", () => {
  it("issues a fresh script nonce without inline-script permission", () => {
    const first = proxy(new NextRequest("https://example.test/login"));
    const second = proxy(new NextRequest("https://example.test/login"));
    const policy = first.headers.get("Content-Security-Policy") ?? "";
    const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
    expect(nonce).toBeTruthy();
    expect(nonce).toBeTruthy();
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(second.headers.get("Content-Security-Policy")).not.toBe(policy);
  });
});
