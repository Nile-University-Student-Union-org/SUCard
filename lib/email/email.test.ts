import { describe, expect, it } from "vitest";
import { emailTemplate } from "./templates";
import { renderFeed, validFeedKey } from "./feed";
import { profileBody } from "@/lib/student/privacy";

describe("email delivery", () => {
  it("escapes user text and links in HTML", () => {
    const result = emailTemplate("password_reset", '<script>alert("x")</script>', 'https://example.com/?a="&b=<');
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).toContain("&quot;&amp;b=&lt;");
  });
  it("renders valid RSS escaping and CDATA boundaries", () => {
    const feed = renderFeed([{ id: "id-1", to: "a@example.com", subject: "A & B", html: "Hi ]]> bye", createdAt: new Date("2026-10-07T00:00:00Z") }]);
    expect(feed).toContain("<title>A &amp; B</title>");
    expect(feed).toContain("<author>a@example.com</author>");
    expect(feed).toContain("]]]]><![CDATA[>");
  });
  it("checks a configured key", () => {
    const key = "12345678901234567890123456789012";
    expect(validFeedKey(key, key)).toBe(true);
    expect(validFeedKey(key.slice(0, -1) + "x", key)).toBe(false);
    expect(validFeedKey("short", key)).toBe(false);
  });
});
it("requires privacy acceptance", () => {
  expect(profileBody.safeParse({ universityId: "231001000", acceptPrivacy: true }).success).toBe(true);
  expect(profileBody.safeParse({ universityId: "231001000" }).success).toBe(false);
  expect(profileBody.safeParse({ universityId: "231001000", acceptPrivacy: false }).success).toBe(false);
});
