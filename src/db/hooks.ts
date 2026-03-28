import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import type { Exercise, WeeklyTemplateEntry } from './database';
import { getWeekId } from '../utils/week';

// ─── Exercises ───

export function useExercises() {
  return useLiveQuery(() => db.exercises.orderBy('name').toArray()) ?? [];
}

export function useExercise(id: string | undefined) {
  return useLiveQuery(() => (id ? db.exercises.get(id) : undefined), [id]);
}

export async function addExercise(data: Omit<Exercise, 'id' | 'createdAt'>) {
  return db.exercises.add({ ...data, id: uuidv4(), createdAt: Date.now() });
}

export async function updateExercise(id: string, data: Partial<Exercise>) {
  return db.exercises.update(id, data);
}

export async function deleteExercise(id: string) {
  await db.transaction('rw', [db.exercises, db.weeklyTemplate, db.completedExercises], async () => {
    await db.exercises.delete(id);
    await db.weeklyTemplate.where('exerciseId').equals(id).delete();
  });
}

// ─── Weekly Template ───

export function useWeeklyTemplate() {
  return useLiveQuery(() => db.weeklyTemplate.orderBy('order').toArray()) ?? [];
}

export async function setTemplateEntry(exerciseId: string, targetCount: number, order: number) {
  const existing = await db.weeklyTemplate.where('exerciseId').equals(exerciseId).first();
  if (existing) {
    return db.weeklyTemplate.update(existing.id, { targetCount, order });
  }
  return db.weeklyTemplate.add({ id: uuidv4(), exerciseId, targetCount, order });
}

export async function removeTemplateEntry(exerciseId: string) {
  return db.weeklyTemplate.where('exerciseId').equals(exerciseId).delete();
}

export async function reorderTemplate(entries: WeeklyTemplateEntry[]) {
  await db.transaction('rw', db.weeklyTemplate, async () => {
    for (let i = 0; i < entries.length; i++) {
      await db.weeklyTemplate.update(entries[i].id, { order: i });
    }
  });
}

// ─── Completed Exercises ───

export function useCompletions(weekId?: string) {
  const wk = weekId ?? getWeekId();
  return useLiveQuery(() => db.completedExercises.where('weekId').equals(wk).toArray(), [wk]) ?? [];
}

export async function completeExercise(
  exerciseId: string,
  kcal: number,
  weight?: number,
  band?: string,
) {
  return db.completedExercises.add({
    id: uuidv4(),
    exerciseId,
    weekId: getWeekId(),
    completedAt: Date.now(),
    weight,
    band,
    kcal,
  });
}

export async function removeCompletion(id: string) {
  return db.completedExercises.delete(id);
}

// ─── Cardio Entries ───

export function useCardioEntries(weekId?: string) {
  const wk = weekId ?? getWeekId();
  return useLiveQuery(() => db.cardioEntries.where('weekId').equals(wk).toArray(), [wk]) ?? [];
}

export async function addCardioEntry(description: string, kcal: number) {
  return db.cardioEntries.add({
    id: uuidv4(),
    weekId: getWeekId(),
    description,
    kcal,
    createdAt: Date.now(),
  });
}

export async function removeCardioEntry(id: string) {
  return db.cardioEntries.delete(id);
}
