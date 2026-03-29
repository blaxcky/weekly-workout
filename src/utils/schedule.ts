import type { WeeklyTemplateEntry, CompletedExercise } from '../db/database';
import { getWeekdayIndex, getDateKey } from './week';

const AUTO_WEEKDAYS = [0, 1, 2, 3, 4] as const;

/**
 * Compute the scheduled weekday indices (0=Mo..6=So) for a template entry.
 * If `scheduledDays` is manually set, use those.
 * Otherwise, use the provided template-wide auto schedule map.
 */
export function getScheduledDays(
  entry: WeeklyTemplateEntry,
  scheduledDaysMap?: Map<string, number[]>,
): number[] {
  if (entry.scheduledDays && entry.scheduledDays.length > 0) {
    return [...entry.scheduledDays].sort((a, b) => a - b);
  }
  if (scheduledDaysMap) {
    return scheduledDaysMap.get(entry.id) ?? [];
  }
  return [...AUTO_WEEKDAYS].slice(0, Math.min(Math.max(entry.targetCount, 0), AUTO_WEEKDAYS.length));
}

/**
 * Build the effective scheduled days for the full template.
 * Manual days are respected as-is; auto-planned entries are balanced globally across Mo–Fr.
 */
export function buildScheduledDaysMap(template: WeeklyTemplateEntry[]): Map<string, number[]> {
  const sortedTemplate = [...template].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const scheduledDaysMap = new Map<string, number[]>();
  const weekdayLoad = new Map<number, number>(AUTO_WEEKDAYS.map((day) => [day, 0]));

  for (const entry of sortedTemplate) {
    if (!entry.scheduledDays || entry.scheduledDays.length === 0) continue;
    const manualDays = [...entry.scheduledDays].sort((a, b) => a - b);
    scheduledDaysMap.set(entry.id, manualDays);
    for (const day of manualDays) {
      if (AUTO_WEEKDAYS.includes(day as (typeof AUTO_WEEKDAYS)[number])) {
        weekdayLoad.set(day, (weekdayLoad.get(day) ?? 0) + 1);
      }
    }
  }

  for (const entry of sortedTemplate) {
    if (entry.scheduledDays && entry.scheduledDays.length > 0) continue;

    const autoDays = computeBalancedAutoDays(entry.targetCount, weekdayLoad);
    scheduledDaysMap.set(entry.id, autoDays);
  }

  return scheduledDaysMap;
}

function computeBalancedAutoDays(targetCount: number, weekdayLoad: Map<number, number>): number[] {
  const clampedTarget = Math.min(Math.max(targetCount, 0), AUTO_WEEKDAYS.length);
  if (clampedTarget === 0) return [];
  if (clampedTarget === AUTO_WEEKDAYS.length) {
    for (const day of AUTO_WEEKDAYS) {
      weekdayLoad.set(day, (weekdayLoad.get(day) ?? 0) + 1);
    }
    return [...AUTO_WEEKDAYS];
  }

  const selectedDays: number[] = [];
  const usedDays = new Set<number>();

  while (selectedDays.length < clampedTarget) {
    const nextDay = [...AUTO_WEEKDAYS]
      .filter((day) => !usedDays.has(day))
      .sort((a, b) => {
        const loadDiff = (weekdayLoad.get(a) ?? 0) - (weekdayLoad.get(b) ?? 0);
        if (loadDiff !== 0) return loadDiff;
        return a - b;
      })[0];

    selectedDays.push(nextDay);
    usedDays.add(nextDay);
    weekdayLoad.set(nextDay, (weekdayLoad.get(nextDay) ?? 0) + 1);
  }

  return selectedDays.sort((a, b) => a - b);
}

/**
 * Categorize all template exercises for today's dashboard view.
 */
export interface DashboardCategories {
  /** Exercises scheduled for today and not yet done today */
  todayTodo: WeeklyTemplateEntry[];
  /** Exercises that should have been done on an earlier day but still have open target slots */
  catchUp: WeeklyTemplateEntry[];
  /** Exercises completed today (regardless of schedule) */
  doneToday: WeeklyTemplateEntry[];
  /** Exercises that have met their weekly target */
  weeklyComplete: WeeklyTemplateEntry[];
}

export function categorizeDashboard(
  template: WeeklyTemplateEntry[],
  completions: CompletedExercise[],
): DashboardCategories {
  const todayIndex = getWeekdayIndex(new Date());
  const todayKey = getDateKey();
  const scheduledDaysMap = buildScheduledDaysMap(template);

  // Count completions per exercise this week
  const weekCounts = new Map<string, number>();
  // Track which exercises were completed today
  const completedTodaySet = new Set<string>();

  for (const c of completions) {
    weekCounts.set(c.exerciseId, (weekCounts.get(c.exerciseId) ?? 0) + 1);
    if (getDateKey(new Date(c.completedAt)) === todayKey) {
      completedTodaySet.add(c.exerciseId);
    }
  }

  // Track which days each exercise was completed on (for catch-up logic)
  const completedDaysMap = new Map<string, Set<number>>();
  for (const c of completions) {
    const dayIndex = getWeekdayIndex(new Date(c.completedAt));
    if (!completedDaysMap.has(c.exerciseId)) {
      completedDaysMap.set(c.exerciseId, new Set());
    }
    completedDaysMap.get(c.exerciseId)!.add(dayIndex);
  }

  const todayTodo: WeeklyTemplateEntry[] = [];
  const catchUp: WeeklyTemplateEntry[] = [];
  const doneToday: WeeklyTemplateEntry[] = [];
  const weeklyComplete: WeeklyTemplateEntry[] = [];

  for (const entry of template) {
    const weekCount = weekCounts.get(entry.exerciseId) ?? 0;
    const scheduledDays = getScheduledDays(entry, scheduledDaysMap);
    const isCompletedToday = completedTodaySet.has(entry.exerciseId);
    const isWeeklyDone = weekCount >= entry.targetCount;

    if (isWeeklyDone) {
      weeklyComplete.push(entry);
      continue;
    }

    if (isCompletedToday) {
      doneToday.push(entry);
      continue;
    }

    // Is this exercise scheduled for today?
    if (scheduledDays.includes(todayIndex)) {
      todayTodo.push(entry);
      continue;
    }

    // Catch-up: scheduled on past days this week but not completed on those days,
    // and still has remaining target slots
    const pastScheduledDays = scheduledDays.filter((d) => d < todayIndex);
    const completedDays = completedDaysMap.get(entry.exerciseId) ?? new Set();
    const missedDays = pastScheduledDays.filter((d) => !completedDays.has(d));

    if (missedDays.length > 0 && weekCount < entry.targetCount) {
      catchUp.push(entry);
    }
  }

  return { todayTodo, catchUp, doneToday, weeklyComplete };
}

/**
 * For the WeekOverview: get per-day stats across the week.
 */
export interface DayStats {
  dayIndex: number;
  scheduled: number;
  completed: number;
}

export function getWeekDayStats(
  template: WeeklyTemplateEntry[],
  completions: CompletedExercise[],
): DayStats[] {
  const scheduledDaysMap = buildScheduledDaysMap(template);

  // Count completions per day
  const completedPerDay = new Map<number, number>();
  for (const c of completions) {
    const day = getWeekdayIndex(new Date(c.completedAt));
    completedPerDay.set(day, (completedPerDay.get(day) ?? 0) + 1);
  }

  // Count scheduled per day
  const scheduledPerDay = new Map<number, number>();
  for (const entry of template) {
    const days = getScheduledDays(entry, scheduledDaysMap);
    for (const d of days) {
      scheduledPerDay.set(d, (scheduledPerDay.get(d) ?? 0) + 1);
    }
  }

  return Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    scheduled: scheduledPerDay.get(i) ?? 0,
    completed: completedPerDay.get(i) ?? 0,
  }));
}
