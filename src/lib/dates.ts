import { formatInTimeZone } from "date-fns-tz";
import { getISOWeek, getISOWeekYear } from "date-fns";

const EST_TIMEZONE = "America/New_York";

export function toEstDate(date: Date = new Date()): Date {
  return new Date(formatInTimeZone(date, EST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss"));
}

export function formatEstDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, EST_TIMEZONE, "MMM d, yyyy");
}

export function formatEstTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, EST_TIMEZONE, "h:mm a");
}

export function formatEstDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, EST_TIMEZONE, "EEE, MMM d, yyyy h:mm a");
}

export function getWeekNumberLabel(date: Date = new Date()): string {
  const week = getISOWeek(date);
  const year = getISOWeekYear(date);
  return `${week} ${year}`;
}

export function getDateRangeLastNDays(days: number): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}
