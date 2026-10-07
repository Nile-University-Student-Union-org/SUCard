/**
 * Cairo timezone and localized formatting helpers for the UI.
 */

export function formatCairoDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatCairoDateOnly(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export const formatCairoDate = formatCairoDateOnly;

export function formatCairoTimeOnly(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatNumber(val?: number | null): string {
  if (val === undefined || val === null) return "0";
  return new Intl.NumberFormat("en-GB").format(val);
}

export function formatCurrency(amount?: number | string | null): string {
  if (amount === undefined || amount === null || amount === "") return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return `EGP ${new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num)}`;
}

export function formatChangePercent(changePercent: number | null | undefined): {
  text: string;
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
} {
  if (changePercent === null || changePercent === undefined) {
    return { text: "New", isPositive: true, isNegative: false, isNeutral: false };
  }
  if (changePercent === 0) {
    return { text: "0.0%", isPositive: false, isNegative: false, isNeutral: true };
  }
  const formatted = Math.abs(changePercent).toFixed(1);
  if (changePercent > 0) {
    return { text: `+${formatted}%`, isPositive: true, isNegative: false, isNeutral: false };
  }
  return { text: `-${formatted}%`, isPositive: false, isNegative: true, isNeutral: false };
}

/** Get today's YYYY-MM-DD string in Africa/Cairo */
export function getCairoTodayString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA formats as YYYY-MM-DD
}

export type DatePresetKey =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "custom";

export interface DatePreset {
  key: DatePresetKey;
  label: string;
  getFromTo: () => { from: string; to: string };
}

function shiftDay(isoDateStr: string, deltaDays: number): string {
  const d = new Date(`${isoDateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function getDatePresets(): DatePreset[] {
  const today = getCairoTodayString();
  const [yearStr, monthStr] = today.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // This month start: YYYY-MM-01
  const thisMonthStart = `${yearStr}-${monthStr}-01`;

  // Last month start and end
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthYear = month === 1 ? year - 1 : year;
  const prevMonthStart = `${prevMonthYear}-${String(prevMonth).padStart(2, "0")}-01`;
  // last day of prev month is 1 day before this month start
  const prevMonthEnd = shiftDay(thisMonthStart, -1);

  return [
    {
      key: "today",
      label: "Today",
      getFromTo: () => ({ from: today, to: today }),
    },
    {
      key: "last_7_days",
      label: "Last 7 days",
      getFromTo: () => ({ from: shiftDay(today, -6), to: today }),
    },
    {
      key: "last_30_days",
      label: "Last 30 days",
      getFromTo: () => ({ from: shiftDay(today, -29), to: today }),
    },
    {
      key: "this_month",
      label: "This month",
      getFromTo: () => ({ from: thisMonthStart, to: today }),
    },
    {
      key: "last_month",
      label: "Last month",
      getFromTo: () => ({ from: prevMonthStart, to: prevMonthEnd }),
    },
  ];
}
