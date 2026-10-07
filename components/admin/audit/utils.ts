import type { AuditEntry } from "@/lib/staff/types";
import { AUDIT_ACTIONS } from "@/lib/staff/types";

export function formatCairoDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatCairoTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatCairoDate(isoString);
  } catch {
    return isoString;
  }
}

export function getCairoDayKey(isoString: string): string {
  try {
    const date = new Date(isoString);
    const cairoString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date); // YYYY-MM-DD

    const nowCairo = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (cairoString === nowCairo) {
      return "Today";
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayCairo = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(yesterday);

    if (cairoString === yesterdayCairo) {
      return "Yesterday";
    }

    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "Earlier";
  }
}

export interface DayGroupedAudit {
  dayLabel: string;
  entries: AuditEntry[];
}

export function groupAuditByDay(entries: AuditEntry[]): DayGroupedAudit[] {
  const groups: Map<string, AuditEntry[]> = new Map();

  for (const entry of entries) {
    const dayKey = getCairoDayKey(entry.createdAt);
    const current = groups.get(dayKey) || [];
    current.push(entry);
    groups.set(dayKey, current);
  }

  return Array.from(groups.entries()).map(([dayLabel, groupEntries]) => ({
    dayLabel,
    entries: groupEntries,
  }));
}

export function getAuditActionSummary(entry: AuditEntry): string {
  const data = entry.data || {};
  const action = entry.action;

  switch (action) {
    case "cards.batch_created": {
      const number = data.batchNumber ?? data.number ?? "";
      const formattedNum = typeof number === "number" ? `#${String(number).padStart(3, "0")}` : number ? `#${number}` : "";
      const count = data.count ?? "";
      const label = data.label ? ` "${data.label}"` : "";
      return `Generated physical batch ${formattedNum}${label}${count ? ` with ${count} cards` : ""}`;
    }
    case "cards.batch_exported": {
      const number = data.batchNumber ?? data.number ?? "";
      const formattedNum = typeof number === "number" ? `#${String(number).padStart(3, "0")}` : number ? `#${number}` : "";
      return `Exported QR codes ZIP for batch ${formattedNum}`;
    }
    case "staff.created": {
      const name = data.name ?? data.staffName ?? "";
      const email = data.email ?? "";
      const role = data.role === "super_admin" ? "Super Admin" : "Admin";
      return `Added staff member ${name || email} (${role})`;
    }
    case "staff.updated": {
      const name = data.name ?? data.staffName ?? "";
      const email = data.email ?? "";
      const changes: string[] = [];
      if (data.status) changes.push(`status: ${data.status}`);
      if (data.role) changes.push(`role: ${data.role === "super_admin" ? "Super Admin" : "Admin"}`);
      if (data.name) changes.push(`name: ${data.name}`);
      const changesText = changes.length > 0 ? ` (${changes.join(", ")})` : "";
      return `Updated staff member ${name || email}${changesText}`;
    }
    case "staff.password_reset": {
      const name = data.name ?? data.staffName ?? "";
      const email = data.email ?? "";
      return `Reset password for staff member ${name || email}`;
    }
    default: {
      const known = AUDIT_ACTIONS[action as keyof typeof AUDIT_ACTIONS];
      return known || action.replace(/[._]/g, " ");
    }
  }
}

export function getAuditActionBadge(action: string): {
  label: string;
  variant: "brand" | "outline" | "success" | "warning" | "destructive";
} {
  const label = AUDIT_ACTIONS[action as keyof typeof AUDIT_ACTIONS] || action;

  if (action.startsWith("cards.")) {
    return { label, variant: "brand" };
  }
  if (action === "staff.created") {
    return { label, variant: "success" };
  }
  if (action === "staff.updated") {
    return { label, variant: "warning" };
  }
  if (action === "staff.password_reset") {
    return { label, variant: "destructive" };
  }

  return { label, variant: "outline" };
}
