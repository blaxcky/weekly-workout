import { db } from './database';

export interface ExportData {
  version: 1;
  exportedAt: string;
  exercises: unknown[];
  weeklyTemplate: unknown[];
  completedExercises: unknown[];
  cardioEntries: unknown[];
}

export async function exportAllData(): Promise<ExportData> {
  const [exercises, weeklyTemplate, completedExercises, cardioEntries] = await Promise.all([
    db.exercises.toArray(),
    db.weeklyTemplate.toArray(),
    db.completedExercises.toArray(),
    db.cardioEntries.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    weeklyTemplate,
    completedExercises,
    cardioEntries,
  };
}

export async function importAllData(data: ExportData): Promise<void> {
  if (data.version !== 1) {
    throw new Error('Unbekanntes Export-Format');
  }
  await db.transaction('rw', [db.exercises, db.weeklyTemplate, db.completedExercises, db.cardioEntries], async () => {
    await db.exercises.clear();
    await db.weeklyTemplate.clear();
    await db.completedExercises.clear();
    await db.cardioEntries.clear();
    await db.exercises.bulkAdd(data.exercises as never[]);
    await db.weeklyTemplate.bulkAdd(data.weeklyTemplate as never[]);
    await db.completedExercises.bulkAdd(data.completedExercises as never[]);
    await db.cardioEntries.bulkAdd(data.cardioEntries as never[]);
  });
}

export function downloadJson(data: ExportData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weekly-workout-backup-${data.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string));
      } catch {
        reject(new Error('Ungültige JSON-Datei'));
      }
    };
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsText(file);
  });
}
