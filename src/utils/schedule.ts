import type { WeeklyTemplateEntry, CompletedExercise, Exercise, TrainingDay } from '../db/database';
import { getDateKey } from './week';

/**
 * Dashboard categories for the new training-day model.
 */
export interface KraftDashboard {
  /** Kraft exercises not yet completed today */
  todo: WeeklyTemplateEntry[];
  /** Kraft exercises completed today */
  done: WeeklyTemplateEntry[];
}

export interface PhysioDashboard {
  /** Physio exercises that haven't reached their weekly target */
  todo: WeeklyTemplateEntry[];
  /** Physio exercises that have reached their weekly target */
  done: WeeklyTemplateEntry[];
  /** Weekly completion counts per exerciseId */
  weekCounts: Map<string, number>;
}

/**
 * Categorize kraft exercises for a training day.
 * Each kraft exercise appears once – either done today or still todo.
 */
export function categorizeKraft(
  kraftEntries: WeeklyTemplateEntry[],
  completions: CompletedExercise[],
  today: Date = new Date(),
): KraftDashboard {
  const todayKey = getDateKey(today);
  const completedTodaySet = new Set<string>();

  for (const c of completions) {
    if (getDateKey(new Date(c.completedAt)) === todayKey) {
      completedTodaySet.add(c.exerciseId);
    }
  }

  const todo: WeeklyTemplateEntry[] = [];
  const done: WeeklyTemplateEntry[] = [];

  for (const entry of kraftEntries) {
    if (completedTodaySet.has(entry.exerciseId)) {
      done.push(entry);
    } else {
      todo.push(entry);
    }
  }

  return { todo, done };
}

/**
 * Categorize physio exercises with weekly progress.
 * Physio has a weekly target (targetCount) and shows progress like "3/5".
 */
export function categorizePhysio(
  physioEntries: WeeklyTemplateEntry[],
  completions: CompletedExercise[],
): PhysioDashboard {
  const weekCounts = new Map<string, number>();
  for (const c of completions) {
    weekCounts.set(c.exerciseId, (weekCounts.get(c.exerciseId) ?? 0) + 1);
  }

  const todo: WeeklyTemplateEntry[] = [];
  const done: WeeklyTemplateEntry[] = [];

  for (const entry of physioEntries) {
    const count = weekCounts.get(entry.exerciseId) ?? 0;
    if (count >= entry.targetCount) {
      done.push(entry);
    } else {
      todo.push(entry);
    }
  }

  return { todo, done, weekCounts };
}

/**
 * For WeekOverview: per-day stats showing training days and completions.
 */
export interface DayStats {
  dayIndex: number;
  isTrainingDay: boolean;
  kraftCompleted: number;
  kraftTotal: number;
  physioCompleted: number;
}

export function getWeekDayStats(
  kraftEntries: WeeklyTemplateEntry[],
  completions: CompletedExercise[],
  trainingDays: TrainingDay[],
  exerciseMap: Map<string, Exercise>,
  weekDates: string[],
): DayStats[] {
  const trainingDateSet = new Set(trainingDays.map((td) => td.date));
  const kraftIds = new Set(kraftEntries.map((e) => e.exerciseId));

  return weekDates.map((dateKey, dayIndex) => {
    const isTrainingDay = trainingDateSet.has(dateKey);
    const dayCompletions = completions.filter(
      (c) => getDateKey(new Date(c.completedAt)) === dateKey,
    );

    const kraftCompleted = dayCompletions.filter((c) => kraftIds.has(c.exerciseId)).length;
    const physioCompleted = dayCompletions.filter((c) => {
      const ex = exerciseMap.get(c.exerciseId);
      return ex?.type === 'physio';
    }).length;

    return {
      dayIndex,
      isTrainingDay,
      kraftCompleted,
      kraftTotal: isTrainingDay ? kraftEntries.length : 0,
      physioCompleted,
    };
  });
}

/**
 * Get the count of training days this week.
 */
export function getTrainingDayCount(trainingDays: TrainingDay[]): number {
  return trainingDays.length;
}
