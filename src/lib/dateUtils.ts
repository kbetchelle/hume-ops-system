/**
 * Shared PST/PDT date utilities for the application.
 * All checklist and operational dates should use these helpers
 * to avoid UTC day-boundary mismatches.
 */

/** Returns today's date string in YYYY-MM-DD format using PST/PDT timezone */
export function getPSTToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}-${parts.find(p => p.type === "day")!.value}`;
}

/** Returns the current hour in PST/PDT (0-23) */
export function getPSTHour(): number {
  const str = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    hour12: false,
  });
  return parseInt(str, 10);
}

/** Returns the current minute in PST/PDT (0-59) */
export function getPSTMinute(): number {
  const str = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    minute: "numeric",
  });
  return parseInt(str, 10);
}

/** Returns the day-of-week (0=Sun … 6=Sat) for a YYYY-MM-DD string interpreted as a local calendar date */
export function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Returns true if the given YYYY-MM-DD falls on Saturday or Sunday */
export function isWeekendDate(dateStr: string): boolean {
  const day = getDayOfWeek(dateStr);
  return day === 0 || day === 6;
}

/** Returns the current PST day-of-week (0=Sun … 6=Sat) */
export function getPSTDayOfWeek(): number {
  return getDayOfWeek(getPSTToday());
}
