import type { OfficeSchedule } from "@/lib/student/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const cairoFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function cairoDate(now: Date): string {
  const parts = Object.fromEntries(cairoFormatter.formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function cairoTime(now: Date): string {
  const parts = Object.fromEntries(cairoFormatter.formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.hour}:${parts.minute}`;
}

function dateAtOffset(date: string, days: number): string {
  const atNoon = new Date(`${date}T12:00:00Z`);
  atNoon.setUTCDate(atNoon.getUTCDate() + days);
  return atNoon.toISOString().slice(0, 10);
}

function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function hoursForDate(schedule: OfficeSchedule, date: string): { closed: boolean; open?: string; close?: string; note?: string } {
  const exception = schedule.exceptions.find((entry) => entry.date === date);
  if (exception) return exception.closed
    ? { closed: true, note: exception.note }
    : { closed: false, open: exception.open, close: exception.close, note: exception.note };
  const weekly = schedule.weekly.find((entry) => entry.day === weekday(date));
  return weekly ? { closed: false, open: weekly.open, close: weekly.close } : { closed: true };
}

export function officeStatus(schedule: OfficeSchedule, now: Date): { openNow: boolean; todayLabel: string; nextOpen: string | null } {
  const today = cairoDate(now);
  const hours = hoursForDate(schedule, today);
  const time = cairoTime(now);
  const openNow = !hours.closed && time >= hours.open! && time < hours.close!;
  const todayLabel = hours.closed ? "Closed today" : `Open today ${hours.open}–${hours.close}`;
  for (let offset = hours.closed || time >= hours.open! ? 1 : 0; offset <= 7 * (schedule.exceptions.length + 1); offset++) {
    const date = dateAtOffset(today, offset);
    const next = hoursForDate(schedule, date);
    if (!next.closed) return { openNow, todayLabel, nextOpen: `Next opens ${offset === 0 ? "today" : DAY_NAMES[weekday(date)]} ${next.open}` };
  }
  const futureException = upcomingExceptions(schedule, now, 60).find((entry) => !entry.closed && (entry.date !== today || time < entry.open!));
  if (futureException) return { openNow, todayLabel, nextOpen: `Next opens ${DAY_NAMES[weekday(futureException.date)]} ${futureException.open}` };
  return { openNow, todayLabel, nextOpen: null };
}

export function weekSummary(schedule: OfficeSchedule): string {
  const labels = DAY_NAMES.map((_, day) => {
    const hours = schedule.weekly.find((entry) => entry.day === day);
    return hours ? `${hours.open}–${hours.close}` : "Closed";
  });
  const groups: string[] = [];
  for (let first = 0; first < 7;) {
    let last = first;
    while (last < 6 && labels[last + 1] === labels[first]) last++;
    groups.push(`${DAY_NAMES[first]}${last > first ? `–${DAY_NAMES[last]}` : ""} ${labels[first]}`);
    first = last + 1;
  }
  return groups.join("; ");
}

export function upcomingExceptions(schedule: OfficeSchedule, now: Date, limit: number): OfficeSchedule["exceptions"] {
  const today = cairoDate(now);
  return schedule.exceptions.filter((entry) => entry.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, limit);
}
