import { describe, expect, it } from "vitest";
import { computeSettingsDiff, type SettingsFormState } from "./diff";

const baseState: SettingsFormState = {
  mode: "digital",
  hasQuota: false,
  quotaRemaining: "",
  allowDigitalUpgrade: true,
  officeLocation: "Student Union Office, Building A",
  weekly: {
    0: { isOpen: true, open: "09:00", close: "17:00" },
    1: { isOpen: true, open: "09:00", close: "17:00" },
    2: { isOpen: true, open: "09:00", close: "17:00" },
    3: { isOpen: true, open: "09:00", close: "17:00" },
    4: { isOpen: true, open: "09:00", close: "17:00" },
    5: { isOpen: false, open: "09:00", close: "17:00" },
    6: { isOpen: false, open: "09:00", close: "17:00" },
  },
  exceptions: [
    { date: "2026-10-15", closed: true, note: "Exam break" },
  ],
  studentEmailPattern: "^[a-z]\\.[a-z]+\\d{4}@nu\\.edu\\.eg$",
};

describe("computeSettingsDiff", () => {
  it("returns empty array when states are identical", () => {
    const diff = computeSettingsDiff(baseState, { ...baseState }, true);
    expect(diff).toEqual([]);
  });

  it("detects issuance mode switch", () => {
    const nextState: SettingsFormState = {
      ...baseState,
      mode: "physical",
    };
    const diff = computeSettingsDiff(baseState, nextState, false);
    expect(diff).toHaveLength(1);
    expect(diff[0].id).toBe("mode");
    expect(diff[0].isHighImpact).toBe(true);
    expect(diff[0].oldValue).toBe("Instant Digital Pass");
    expect(diff[0].newValue).toBe("Physical Office Collection");
  });

  it("detects allowDigitalUpgrade toggle", () => {
    const nextState: SettingsFormState = {
      ...baseState,
      allowDigitalUpgrade: false,
    };
    const diff = computeSettingsDiff(baseState, nextState, false);
    expect(diff).toHaveLength(1);
    expect(diff[0].id).toBe("allowDigitalUpgrade");
    expect(diff[0].type).toBe("boolean");
    expect(diff[0].oldValue).toBe(true);
    expect(diff[0].newValue).toBe(false);
  });

  it("detects weekly operating hours change", () => {
    const nextState: SettingsFormState = {
      ...baseState,
      weekly: {
        ...baseState.weekly,
        0: { isOpen: true, open: "10:00", close: "18:00" }, // time changed
        4: { isOpen: false, open: "09:00", close: "17:00" }, // closed thursday
      },
    };
    const diff = computeSettingsDiff(baseState, nextState, false);
    expect(diff).toHaveLength(1);
    expect(diff[0].id).toBe("weekly");
    expect(diff[0].type).toBe("list");
    expect(diff[0].listChanges).toHaveLength(2);
    expect(diff[0].listChanges?.[0]).toEqual({
      type: "changed",
      label: "Sunday",
      oldValue: "09:00–17:00",
      newValue: "10:00–18:00",
    });
    expect(diff[0].listChanges?.[1]).toEqual({
      type: "removed",
      label: "Thursday: 09:00–17:00",
      oldValue: "09:00–17:00",
      newValue: "Closed",
    });
  });

  it("detects date overrides additions and removals", () => {
    const nextState: SettingsFormState = {
      ...baseState,
      exceptions: [
        { date: "2026-10-20", closed: false, open: "12:00", close: "16:00", note: "Half day" },
      ],
    };
    const diff = computeSettingsDiff(baseState, nextState, false);
    expect(diff).toHaveLength(1);
    expect(diff[0].id).toBe("exceptions");
    expect(diff[0].type).toBe("list");
    expect(diff[0].listChanges).toHaveLength(2); // 1 removed (2026-10-15), 1 added (2026-10-20)
  });

  it("detects email pattern change only when super admin", () => {
    const nextState: SettingsFormState = {
      ...baseState,
      studentEmailPattern: "^[a-z]+@nu\\.edu\\.eg$",
    };
    const adminDiff = computeSettingsDiff(baseState, nextState, false);
    expect(adminDiff).toHaveLength(0);

    const superAdminDiff = computeSettingsDiff(baseState, nextState, true);
    expect(superAdminDiff).toHaveLength(1);
    expect(superAdminDiff[0].id).toBe("studentEmailPattern");
  });
});
