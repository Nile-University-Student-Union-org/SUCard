import type { OfficeSchedule } from "@/lib/student/types";
import { formatDisplayDate } from "@/components/ui/date-picker";

export type ChangeFieldType = "text" | "number" | "boolean" | "list";

export interface ListItemChange {
  type: "added" | "removed" | "changed";
  label: string;
  oldValue?: string;
  newValue?: string;
}

export interface ChangeItem {
  id: string;
  label: string;
  category?: string;
  type: ChangeFieldType;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
  listChanges?: ListItemChange[];
  isHighImpact?: boolean;
  impactWarning?: string;
}

export interface DayScheduleState {
  isOpen: boolean;
  open: string;
  close: string;
}

export type WeeklyScheduleState = Record<number, DayScheduleState>;

export interface SettingsFormState {
  mode: "digital" | "physical";
  hasQuota: boolean;
  quotaRemaining: string;
  allowDigitalUpgrade: boolean;
  officeLocation: string;
  weekly: WeeklyScheduleState;
  exceptions: OfficeSchedule["exceptions"];
  studentEmailPattern: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatExceptionSummary(ex: OfficeSchedule["exceptions"][number]): string {
  const timeDesc = ex.closed ? "Closed all day" : `${ex.open}–${ex.close}`;
  return ex.note ? `${timeDesc} (“${ex.note}”)` : timeDesc;
}

function formatExceptionLabel(ex: OfficeSchedule["exceptions"][number]): string {
  const displayDate = formatDisplayDate(ex.date);
  const dayName = new Date(`${ex.date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    timeZone: "UTC",
  });
  return `${displayDate} (${dayName}): ${formatExceptionSummary(ex)}`;
}

export function computeSettingsDiff(
  saved: SettingsFormState,
  current: SettingsFormState,
  isSuperAdmin = false
): ChangeItem[] {
  const changes: ChangeItem[] = [];

  // 1. Issuance mode
  if (saved.mode !== current.mode) {
    const isNowPhysical = current.mode === "physical";
    changes.push({
      id: "mode",
      label: "Default issuance mode",
      category: "Card Issuance Rules",
      type: "text",
      oldValue: saved.mode === "digital" ? "Instant Digital Pass" : "Physical Office Collection",
      newValue: isNowPhysical ? "Physical Office Collection" : "Instant Digital Pass",
      isHighImpact: true,
      impactWarning: isNowPhysical
        ? "New students will be required to visit the SU office to collect a physical card before activation."
        : "New students will receive instant digital passes upon registration.",
    });
  }

  // 2. Physical quota (only relevant if mode is physical or was physical)
  const savedQuotaDesc = !saved.hasQuota
    ? "Unlimited"
    : `${saved.quotaRemaining.trim() || "0"} physical cards`;
  const currentQuotaDesc = !current.hasQuota
    ? "Unlimited"
    : `${current.quotaRemaining.trim() || "0"} physical cards`;

  if (
    (current.mode === "physical" || saved.mode === "physical") &&
    (saved.hasQuota !== current.hasQuota || (current.hasQuota && saved.quotaRemaining.trim() !== current.quotaRemaining.trim()))
  ) {
    changes.push({
      id: "physicalQuotaRemaining",
      label: "Physical sign-up quota limit",
      category: "Card Issuance Rules",
      type: "text",
      oldValue: savedQuotaDesc,
      newValue: currentQuotaDesc,
    });
  }

  // 3. Allow digital -> physical upgrade
  if (saved.allowDigitalUpgrade !== current.allowDigitalUpgrade) {
    changes.push({
      id: "allowDigitalUpgrade",
      label: "Allow digital to physical card upgrade",
      category: "Card Issuance Rules",
      type: "boolean",
      oldValue: saved.allowDigitalUpgrade,
      newValue: current.allowDigitalUpgrade,
    });
  }

  // 4. Office pickup location
  if (saved.officeLocation.trim() !== current.officeLocation.trim()) {
    changes.push({
      id: "officeLocation",
      label: "Office pickup desk location",
      category: "Office Location & Hours",
      type: "text",
      oldValue: saved.officeLocation.trim() || "—",
      newValue: current.officeLocation.trim() || "—",
    });
  }

  // 5. Weekly schedule
  const dayChanges: ListItemChange[] = [];
  for (let d = 0; d <= 6; d++) {
    const savedDay = saved.weekly[d] ?? { isOpen: false, open: "09:00", close: "17:00" };
    const currDay = current.weekly[d] ?? { isOpen: false, open: "09:00", close: "17:00" };

    if (savedDay.isOpen && !currDay.isOpen) {
      dayChanges.push({
        type: "removed",
        label: `${DAY_NAMES[d]}: ${savedDay.open}–${savedDay.close}`,
        oldValue: `${savedDay.open}–${savedDay.close}`,
        newValue: "Closed",
      });
    } else if (!savedDay.isOpen && currDay.isOpen) {
      dayChanges.push({
        type: "added",
        label: `${DAY_NAMES[d]}: ${currDay.open}–${currDay.close}`,
        oldValue: "Closed",
        newValue: `${currDay.open}–${currDay.close}`,
      });
    } else if (savedDay.isOpen && currDay.isOpen && (savedDay.open !== currDay.open || savedDay.close !== currDay.close)) {
      dayChanges.push({
        type: "changed",
        label: `${DAY_NAMES[d]}`,
        oldValue: `${savedDay.open}–${savedDay.close}`,
        newValue: `${currDay.open}–${currDay.close}`,
      });
    }
  }

  if (dayChanges.length > 0) {
    changes.push({
      id: "weekly",
      label: "Office weekly operating hours",
      category: "Office Location & Hours",
      type: "list",
      listChanges: dayChanges,
    });
  }

  // 6. Date overrides / Exceptions
  const savedExMap = new Map(saved.exceptions.map((ex) => [ex.date, ex]));
  const currExMap = new Map(current.exceptions.map((ex) => [ex.date, ex]));
  const allDates = Array.from(new Set([...savedExMap.keys(), ...currExMap.keys()])).sort();

  const exChanges: ListItemChange[] = [];
  for (const date of allDates) {
    const savedEx = savedExMap.get(date);
    const currEx = currExMap.get(date);

    if (!savedEx && currEx) {
      exChanges.push({
        type: "added",
        label: formatExceptionLabel(currEx),
        newValue: formatExceptionSummary(currEx),
      });
    } else if (savedEx && !currEx) {
      exChanges.push({
        type: "removed",
        label: formatExceptionLabel(savedEx),
        oldValue: formatExceptionSummary(savedEx),
      });
    } else if (savedEx && currEx) {
      const isDifferent =
        savedEx.closed !== currEx.closed ||
        savedEx.open !== currEx.open ||
        savedEx.close !== currEx.close ||
        (savedEx.note || "") !== (currEx.note || "");

      if (isDifferent) {
        const displayDate = formatDisplayDate(date);
        exChanges.push({
          type: "changed",
          label: `${displayDate}`,
          oldValue: formatExceptionSummary(savedEx),
          newValue: formatExceptionSummary(currEx),
        });
      }
    }
  }

  if (exChanges.length > 0) {
    changes.push({
      id: "exceptions",
      label: "Specific dates & holiday overrides",
      category: "Office Location & Hours",
      type: "list",
      listChanges: exChanges,
    });
  }

  // 7. Student email pattern (Super Admin only)
  if (isSuperAdmin && saved.studentEmailPattern.trim() !== current.studentEmailPattern.trim()) {
    changes.push({
      id: "studentEmailPattern",
      label: "Student email regex pattern",
      category: "Access & Validation",
      type: "text",
      oldValue: saved.studentEmailPattern.trim(),
      newValue: current.studentEmailPattern.trim(),
      isHighImpact: true,
      impactWarning: "Directly affects Microsoft SSO registration validation for Nile University students.",
    });
  }

  return changes;
}
