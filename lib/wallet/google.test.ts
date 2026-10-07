import { generateKeyPairSync, createVerify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildGenericClass, buildGenericObject, buildRedemptionMessage, buildSaveUrl, objectId, signJwt } from "./google";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const key = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const config = { issuerId: "123456", baseUrl: "https://example.com", email: "wallet@example.com", privateKey: key, keyFile: "unused" };
const student = { name: "Test Student", profile: { userId: "student-1", universityId: "231001001", status: "active" as const,
  cardFlow: "digital" as const, suspendReason: null, registeredAt: "2026-01-01T00:00:00.000Z" } };
const card = { qr: "NUSU1:EXACT_TOKEN" };

describe("Google Wallet", () => {
  it("signs an RS256 save URL for the existing object", () => {
    const jwt = buildSaveUrl(config, objectId(config.issuerId, student.profile.userId)).split("/").at(-1)!;
    const [header, payload, signature] = jwt.split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({
      iss: config.email, aud: "google", typ: "savetowallet", origins: [],
      payload: { genericObjects: [{ id: "123456.student_student-1" }] },
    });
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${payload}`);
    verifier.end();
    expect(verifier.verify(publicKey, Buffer.from(signature, "base64url"))).toBe(true);
    expect(signJwt({ test: true }, key).split(".")).toHaveLength(3);
  });

  it("keeps object ids in Google's allowed character set without losing distinct IDs", () => {
    expect(objectId("123", "a/b")).toMatch(/^123\.student_[A-Za-z0-9._-]+$/);
    expect(objectId("123", "a/b")).not.toBe(objectId("123", "a_b"));
  });

  it("builds the class and object with the exact QR and inactive state", () => {
    expect(buildGenericClass("123456")).toMatchObject({ id: "123456.su_card_v1", reviewStatus: "UNDER_REVIEW", multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES" });
    const active = buildGenericObject(config, student, card);
    expect(active).toMatchObject({
      id: "123456.student_student-1", classId: "123456.su_card_v1", hexBackgroundColor: "#0F3056",
      logo: { sourceUri: { uri: "https://example.com/brand/wallet-logo.png" }, contentDescription: { defaultValue: { value: "NUSU" } } },
      heroImage: { sourceUri: { uri: "https://example.com/brand/wallet-hero.png" } },
      barcode: { type: "QR_CODE", value: "NUSU1:EXACT_TOKEN", alternateText: "ID 231001001" },
      state: "ACTIVE",
    });
    expect(active.textModulesData[0]).toMatchObject({ header: "University ID", body: "231001001" });
    expect(buildGenericObject(config, { ...student, profile: { ...student.profile, status: "suspended" } }, card).state).toBe("INACTIVE");
    expect(buildGenericObject(config, student, null).state).toBe("INACTIVE");
  });

  it("leaves the logo out when the app has no public https address", () => {
    expect(buildGenericObject({ ...config, baseUrl: "http://localhost:3000" }, student, card)).not.toHaveProperty("logo");
    expect(buildGenericObject({ ...config, baseUrl: "http://localhost:3000" }, student, card)).not.toHaveProperty("heroImage");
  });

  it("builds a notifying redemption message with Cairo time and a 30-day interval", () => {
    const at = new Date("2026-01-01T12:05:00.000Z");
    expect(buildRedemptionMessage({ redemptionId: "scan-1", vendorName: "Breadfast", discountLabel: "20% off", offerTitle: "Breakfast box", at })).toEqual({
      message: {
        id: "redemption_scan-1",
        header: "Used at Breadfast",
        body: "20% off: Breakfast box · 2:05 PM Cairo",
        messageType: "TEXT_AND_NOTIFY",
        displayInterval: {
          start: { date: "2026-01-01T12:05:00.000Z" },
          end: { date: "2026-01-31T12:05:00.000Z" },
        },
      },
    });
  });

  it("keeps long names and offer copy within Wallet message limits", () => {
    const { message } = buildRedemptionMessage({
      redemptionId: "scan-2",
      vendorName: "Vendor 🎉 ".repeat(20),
      discountLabel: "A very long discount ".repeat(10),
      offerTitle: "Fresh bread 🥖 ".repeat(30),
      at: new Date("2026-01-01T12:05:00.000Z"),
    });
    expect(Array.from(message.header).length).toBeLessThanOrEqual(40);
    expect(Array.from(message.body).length).toBeLessThanOrEqual(120);
    expect(message.body).toMatch(/ · 2:05 PM Cairo$/);
  });

  it("uses Cairo daylight saving time in summer", () => {
    const { message } = buildRedemptionMessage({ redemptionId: "scan-3", vendorName: "Breadfast", discountLabel: "20% off", offerTitle: "Breakfast box", at: new Date("2026-07-01T12:05:00.000Z") });
    expect(message.body).toBe("20% off: Breakfast box · 3:05 PM Cairo");
  });
});
