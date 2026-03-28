import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import type { Exercise } from '../db/database';
import { completeExercise } from '../db/hooks';
import { updateExercise } from '../db/hooks';

interface CompletionDialogProps {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
}

export default function CompletionDialog({ exercise, open, onClose }: CompletionDialogProps) {
  const [weight, setWeight] = useState<string>('');
  const [band, setBand] = useState<string>('');

  useEffect(() => {
    if (exercise) {
      setWeight(exercise.defaultWeight?.toString() ?? '');
      setBand(exercise.defaultBand ?? '');
    }
  }, [exercise]);

  if (!exercise) return null;

  const handleComplete = async () => {
    const w = exercise.equipment === 'gewicht' ? parseFloat(weight) || undefined : undefined;
    const b = exercise.equipment === 'band' ? band || undefined : undefined;

    await completeExercise(exercise.id, exercise.kcalPerCompletion, w, b);

    // Update default values
    if (exercise.equipment === 'gewicht' && w !== exercise.defaultWeight) {
      await updateExercise(exercise.id, { defaultWeight: w });
    }
    if (exercise.equipment === 'band' && b !== exercise.defaultBand) {
      await updateExercise(exercise.id, { defaultBand: b });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Übung abschließen</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          {exercise.name}
        </Typography>

        {exercise.equipment === 'gewicht' && (
          <TextField
            label="Gewicht (kg)"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ step: 0.5, min: 0 }}
          />
        )}

        {exercise.equipment === 'band' && (
          <TextField
            label="Bandwiderstand"
            value={band}
            onChange={(e) => setBand(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="z.B. rot-mittel"
          />
        )}

        {exercise.equipment === 'koerper' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Körperübung – kein Equipment nötig
          </Typography>
        )}

        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Kalorien: <strong>{exercise.kcalPerCompletion} kcal</strong>
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleComplete} variant="contained" color="primary">
          Erledigt ✓
        </Button>
      </DialogActions>
    </Dialog>
  );
}
