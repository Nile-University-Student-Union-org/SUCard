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
    const feed = renderFeed([{ id: "id-1", leaseId: "lease-1", to: "a@example.com", subject: "A & B", html: "Hi ]]> bye", createdAt: new Date("2026-10-07T00:00:00Z") }]);
    expect(feed).toContain("<title>A &amp; B</title>");
    expect(feed).toContain("<su:lease>lease-1</su:lease>");
    expect(feed).toContain("<author>a@example.com</author>");
    expect(feed).toContain("]]]]><![CDATA[>");
  });
  it("checks a configured key", () => {
    const key = "12345678901234567890123456789012";
    expect(validFeedKey(key, key)).toBe(true);
    expect(validFeedKey(key.slice(0, -1) + "x", key)).toBe(false);
    expect(validFeedKey("short", key)).toBe(false);
  });
  it("explains a voided card and the next step", () => {
    const digital = emailTemplate("card_voided", "Student", undefined, { cardType: "digital", reason: "Damaged <pass>" });
    expect(digital.subject).toBe("Your SU Card has been voided");
    expect(digital.text).toContain("Reason: Damaged <pass>");
    expect(digital.text).toContain("sign in to get a new pass");
    expect(digital.html).toContain("Damaged &lt;pass&gt;");
    const physical = emailTemplate("card_voided", "Student", undefined, { cardType: "physical", officeLocation: "Building A" });
    expect(physical.text).toContain("visit Building A");
    const switched = emailTemplate("card_voided", "Student", undefined, { cardType: "digital", reason: "switched_to_physical", officeLocation: "SU room, Building B" });
    expect(switched.text).toContain("collect your physical card at SU room, Building B");
    expect(switched.text).not.toContain("Reason: switched_to_physical");
  });
  it("requires bearer authorization in the header", async () => {
    const { authorizedMailer } = await import("./feed");
    const prior = process.env.MAILER_FEED_KEY;
    process.env.MAILER_FEED_KEY = "12345678901234567890123456789012";
    try {
      expect(authorizedMailer(new Request("https://example.com/api/mailer/feed?key=12345678901234567890123456789012"))).toBe(false);
      expect(authorizedMailer(new Request("https://example.com/api/mailer/feed", { headers: { authorization: `Bearer ${process.env.MAILER_FEED_KEY}` } }))).toBe(true);
      expect(authorizedMailer(new Request("https://example.com/api/mailer/feed", { headers: { authorization: `Basic ${process.env.MAILER_FEED_KEY}` } }))).toBe(false);
    } finally {
      if (prior === undefined) delete process.env.MAILER_FEED_KEY;
      else process.env.MAILER_FEED_KEY = prior;
    }
  });
});
it("requires privacy acceptance", () => {
  expect(profileBody.safeParse({ universityId: "231001000", acceptPrivacy: true }).success).toBe(true);
  expect(profileBody.safeParse({ universityId: "231001000" }).success).toBe(false);
  expect(profileBody.safeParse({ universityId: "231001000", acceptPrivacy: false }).success).toBe(false);
});
