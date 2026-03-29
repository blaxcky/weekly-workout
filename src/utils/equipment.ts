import type { Exercise } from '../db/database';

export type ExerciseEquipment = Exercise['equipment'];

export const EQUIPMENT_OPTIONS: Array<{ value: ExerciseEquipment; label: string }> = [
  { value: 'kurzhantel', label: 'Kurzhantel' },
  { value: 'langhantel', label: 'Langhantel' },
  { value: 'koerpergewicht', label: 'Körpergewicht' },
  { value: 'theraband', label: 'Theraband' },
];

export function getEquipmentLabel(equipment: ExerciseEquipment): string {
  switch (equipment) {
    case 'kurzhantel':
      return 'Kurzhantel';
    case 'langhantel':
      return 'Langhantel';
    case 'koerpergewicht':
      return 'Körpergewicht';
    case 'theraband':
      return 'Theraband';
    case 'gewicht':
      return 'Gewicht';
    case 'band':
      return 'Band';
    case 'koerper':
      return 'Körper';
    default:
      return equipment;
  }
}

export function usesWeightInput(equipment: ExerciseEquipment): boolean {
  return equipment === 'kurzhantel' || equipment === 'langhantel' || equipment === 'gewicht';
}

export function usesBandInput(equipment: ExerciseEquipment): boolean {
  return equipment === 'theraband' || equipment === 'band';
}

export function isBodyweightEquipment(equipment: ExerciseEquipment): boolean {
  return equipment === 'koerpergewicht' || equipment === 'koerper';
}

export function toEditableEquipment(equipment: ExerciseEquipment): ExerciseEquipment {
  switch (equipment) {
    case 'gewicht':
      return 'kurzhantel';
    case 'band':
      return 'theraband';
    case 'koerper':
      return 'koerpergewicht';
    default:
      return equipment;
  }
}
