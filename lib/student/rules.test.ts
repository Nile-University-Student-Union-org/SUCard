import { describe, expect, it } from "vitest";
import { claimDecision, computeAreas, decideFlow, goDestination, matchesStudentEmail, parseClaimQr, UNIVERSITY_ID_REGEX } from "./rules";

const token = "0123456789ABCDEFGHJK";
describe("student rules", () => {
  it("accepts only SU payloads or HTTPS claim links", () => {
    expect(parseClaimQr(`nusu1:${token.toLowerCase()}`)).toBe(token);
    expect(parseClaimQr(`HTTPS://example.org/c/${token.toLowerCase()}`)).toBe(token);
    expect(parseClaimQr(`http://example.org/c/${token}`)).toBeNull();
    expect(parseClaimQr(`https://example.org/other/${token}`)).toBeNull();
    expect(parseClaimQr("junk")).toBeNull();
  });
  it("validates student email and ID", () => {
    expect(matchesStudentEmail("A.Wesam2300@NU.EDU.EG")).toBe(true);
    for (const email of ["a.wesam.2300@nu.edu.eg", "ahmed.wesam@nu.edu.eg", "a.wesam23@nu.edu.eg"]) expect(matchesStudentEmail(email)).toBe(false);
    expect(UNIVERSITY_ID_REGEX.test("231001001")).toBe(true);
    expect(UNIVERSITY_ID_REGEX.test("23100101a")).toBe(false);
  });
  it("assigns physical until quota reaches zero", () => {
    expect(decideFlow({ mode: "physical", physicalQuotaRemaining: 2 }).next).toEqual({ mode: "physical", physicalQuotaRemaining: 1 });
    expect(decideFlow({ mode: "physical", physicalQuotaRemaining: 1 })).toEqual({ flow: "physical", next: { mode: "digital", physicalQuotaRemaining: 0 }, switched: true });
    expect(decideFlow({ mode: "digital", physicalQuotaRemaining: null }).flow).toBe("digital");
  });
  it("decides claims with card state precedence", () => {
    expect(claimDecision(null, null, true)).toBe("not_su_card");
    expect(claimDecision({ status: "void" }, null, true)).toBe("cancelled");
    expect(claimDecision({ status: "active" }, null, true)).toBe("already_linked");
    expect(claimDecision({ status: "unassigned" }, "physical", true)).toBe("already_has_card");
    expect(claimDecision({ status: "unassigned" }, "digital", false)).toBe("already_has_card");
    expect(claimDecision({ status: "unassigned" }, "digital", true)).toBe("upgrade");
    expect(claimDecision({ status: "unassigned" }, null, true)).toBe("link");
  });
  it("computes areas and routing", () => {
    expect(computeAreas(false, false, "student", false)).toEqual([]);
    expect(computeAreas(true, false, "admin", false).map((area) => area.key)).toEqual(["student", "admin"]);
    expect(computeAreas(true, false, "admin", true)).toEqual([]);
    const areas = computeAreas(true, false, "admin", false);
    expect(goDestination(areas, false)).toBe("/choose");
    expect(goDestination(areas, false, "admin")).toBe("/admin/cards");
    expect(goDestination(areas, true)).toBe("/welcome");
    expect(goDestination([], false)).toBe("/login?error=no_access");
  });
});
