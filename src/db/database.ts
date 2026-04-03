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
  targetCount: number;
  order: number;
  isOptional?: boolean;
  /** Optional: manually assigned weekday indices (0=Mo..4=Fr, 5=Sa, 6=So). If unset, auto-scheduled. */
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

const db = new Dexie('WeeklyWorkoutDB') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  weeklyTemplate: EntityTable<WeeklyTemplateEntry, 'id'>;
  completedExercises: EntityTable<CompletedExercise, 'id'>;
  cardioEntries: EntityTable<CardioEntry, 'id'>;
};

db.version(1).stores({
  exercises: 'id, name, type, createdAt',
  weeklyTemplate: 'id, exerciseId, order',
  completedExercises: 'id, exerciseId, weekId, completedAt',
  cardioEntries: 'id, weekId, createdAt',
});

export { db };
