/**
 * Returns the ISO 8601 week ID for a given date, e.g. "2026-W13"
 */
export function getWeekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns the Monday and Sunday of the ISO week for a given date.
 */
export function getWeekRange(date: Date = new Date()): { monday: Date; sunday: Date } {
  const d = new Date(date);
  const day = d.getDay() || 7; // Monday=1, Sunday=7
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

/**
 * Formats a week ID like "2026-W13" to "KW 13 / 2026"
 */
export function formatWeekId(weekId: string): string {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekId;
  return `KW ${parseInt(match[2])} / ${match[1]}`;
}

/**
 * Returns the date range string for the current week, e.g. "24.03. – 30.03.2026"
 */
export function formatWeekRange(date: Date = new Date()): string {
  const { monday, sunday } = getWeekRange(date);
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
  return `${fmt(monday)} – ${fmt(sunday)}${sunday.getFullYear()}`;
}

/**
 * Returns a date key like "2026-03-28" for grouping by day.
 */
export function getDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Returns the weekday index (0=Mo, 6=So) for a given date.
 */
export function getWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7; // JS: 0=So → we want 0=Mo
}

export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

/**
 * Returns today's weekday index (0=Mo, 6=So).
 */
export function getTodayWeekdayIndex(): number {
  return getWeekdayIndex(new Date());
}
