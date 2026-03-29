import type { WeeklyTemplateEntry, CompletedExercise } from '../db/database';
import { getWeekdayIndex, getDateKey } from './week';

/**
 * Compute the scheduled weekday indices (0=Mo..6=So) for a template entry.
 * If `scheduledDays` is manually set, use those.
 * Otherwise, distribute evenly across Mo–Fr (0–4), spilling to Sa/So only when targetCount > 5.
 */
export function getScheduledDays(entry: WeeklyTemplateEntry): number[] {
  if (entry.scheduledDays && entry.scheduledDays.length > 0) {
    return [...entry.scheduledDays].sort((a, b) => a - b);
  }
  return computeAutoDays(entry.targetCount, entry.order);
}

/**
 * Deterministic auto-distribution preferring Mo–Fr.
 * Uses `order` as offset so exercises don't all land on the same days.
 */
function computeAutoDays(targetCount: number, order: number): number[] {
  if (targetCount <= 0) return [];
  if (targetCount >= 7) return [0, 1, 2, 3, 4, 5, 6];

  // For targetCount <= 5, distribute over Mo–Fr (0–4)
  // For targetCount 6, add one weekend day
  const poolSize = targetCount <= 5 ? 5 : 7;
  const pool = targetCount <= 5 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6];

  const spacing = poolSize / targetCount;
  const offset = (order * 1.618) % poolSize; // golden ratio offset for good spread
  const days: Set<number> = new Set();

  for (let i = 0; i < targetCount; i++) {
    const rawIndex = (offset + i * spacing) % poolSize;
    const dayIndex = pool[Math.floor(rawIndex)];
    days.add(dayIndex);
  }

  // If set is smaller than targetCount due to rounding, fill gaps
  if (days.size < targetCount) {
    for (const d of pool) {
      if (days.size >= targetCount) break;
      days.add(d);
    }
  }

  return [...days].sort((a, b) => a - b);
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
    const scheduledDays = getScheduledDays(entry);
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
  // Count completions per day
  const completedPerDay = new Map<number, number>();
  for (const c of completions) {
    const day = getWeekdayIndex(new Date(c.completedAt));
    completedPerDay.set(day, (completedPerDay.get(day) ?? 0) + 1);
  }

  // Count scheduled per day
  const scheduledPerDay = new Map<number, number>();
  for (const entry of template) {
    const days = getScheduledDays(entry);
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
