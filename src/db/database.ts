import Dexie, { type EntityTable } from 'dexie';

export interface Exercise {
  id: string;
  name: string;
  type: 'kraft' | 'physio';
  equipment: 'kurzhantel' | 'langhantel' | 'koerpergewicht' | 'theraband' | 'gewicht' | 'band' | 'koerper';
  defaultWeight?: number;
  defaultBand?: string;
  kcalPerCompletion: number;
  notes?: string;
  createdAt: number;
}

export interface WeeklyTemplateEntry {
  id: string;
  exerciseId: string;
  /** For physio: weekly target (e.g. 5x/week). For kraft: ignored (always 1x per training day). */
  targetCount: number;
  order: number;
  isOptional?: boolean;
  /** @deprecated No longer used – kept for migration compatibility. */
  scheduledDays?: number[];
}

export interface CompletedExercise {
  id: string;
  exerciseId: string;
  weekId: string;
  completedAt: number;
  weight?: number;
  band?: string;
  kcal: number;
}

export interface CardioEntry {
  id: string;
  weekId: string;
  description: string;
  kcal: number;
  createdAt: number;
}

export interface TrainingDay {
  id: string;
  weekId: string;
  /** Date key like "2026-04-05" */
  date: string;
  createdAt: number;
}

const db = new Dexie('WeeklyWorkoutDB') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  weeklyTemplate: EntityTable<WeeklyTemplateEntry, 'id'>;
  completedExercises: EntityTable<CompletedExercise, 'id'>;
  cardioEntries: EntityTable<CardioEntry, 'id'>;
  trainingDays: EntityTable<TrainingDay, 'id'>;
};

db.version(1).stores({
  exercises: 'id, name, type, createdAt',
  weeklyTemplate: 'id, exerciseId, order',
  completedExercises: 'id, exerciseId, weekId, completedAt',
  cardioEntries: 'id, weekId, createdAt',
});

db.version(2).stores({
  exercises: 'id, name, type, createdAt',
  weeklyTemplate: 'id, exerciseId, order',
  completedExercises: 'id, exerciseId, weekId, completedAt',
  cardioEntries: 'id, weekId, createdAt',
  trainingDays: 'id, weekId, date',
});

export { db };
