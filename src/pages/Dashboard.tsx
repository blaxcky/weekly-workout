import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Fab,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useExercises, useWeeklyTemplate, useCompletions, useCardioEntries, removeCompletion, removeCardioEntry } from '../db/hooks';
import type { Exercise } from '../db/database';
import ExerciseCard from '../components/ExerciseCard';
import CompletionDialog from '../components/CompletionDialog';
import CardioDialog from '../components/CardioDialog';
import { getWeekId, formatWeekId, formatWeekRange, getDateKey, getWeekdayIndex } from '../utils/week';

export default function Dashboard() {
  const exercises = useExercises();
  const template = useWeeklyTemplate();
  const completions = useCompletions();
  const cardioEntries = useCardioEntries();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [cardioOpen, setCardioOpen] = useState(false);

  const weekId = getWeekId();
  const todayKey = getDateKey();

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises.forEach((e) => map.set(e.id, e));
    return map;
  }, [exercises]);

  const completionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    completions.forEach((c) => {
      counts.set(c.exerciseId, (counts.get(c.exerciseId) ?? 0) + 1);
    });
    return counts;
  }, [completions]);

  // Per-exercise: which weekdays (0=Mo..6=So) it was completed on
  const completedDaysMap = useMemo(() => {
    const map = new Map<string, number[]>();
    completions.forEach((c) => {
      const dayIndex = getWeekdayIndex(new Date(c.completedAt));
      const days = map.get(c.exerciseId) ?? [];
      if (!days.includes(dayIndex)) days.push(dayIndex);
      map.set(c.exerciseId, days);
    });
    return map;
  }, [completions]);

  // Daily kcal (today)
  const todayExerciseKcal = completions
    .filter((c) => getDateKey(new Date(c.completedAt)) === todayKey)
    .reduce((sum, c) => sum + c.kcal, 0);
  const todayCardioKcal = cardioEntries
    .filter((c) => getDateKey(new Date(c.createdAt)) === todayKey)
    .reduce((sum, c) => sum + c.kcal, 0);
  const todayKcal = todayExerciseKcal + todayCardioKcal;

  // Weekly kcal
  const weekExerciseKcal = completions.reduce((sum, c) => sum + c.kcal, 0);
  const weekCardioKcal = cardioEntries.reduce((sum, c) => sum + c.kcal, 0);
  const weekKcal = weekExerciseKcal + weekCardioKcal;

  const totalTarget = template.reduce((sum, t) => sum + t.targetCount, 0);
  const totalCompleted = template.reduce(
    (sum, t) => sum + Math.min(completionCounts.get(t.exerciseId) ?? 0, t.targetCount),
    0,
  );

  const handleComplete = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCompletionOpen(true);
  };

  return (
    <Box>
      {/* Week Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          {formatWeekId(weekId)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatWeekRange()}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, overflow: 'auto' }}>
        {/* Daily kcal - prominent */}
        <Card sx={{ flex: 1, minWidth: 120 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LocalFireDepartmentIcon color="error" fontSize="small" />
              <Typography variant="caption" color="text.secondary">kcal heute</Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} color="error.main">{todayKcal}</Typography>
          </CardContent>
        </Card>
        {/* Weekly kcal */}
        <Card sx={{ flex: 1, minWidth: 120 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LocalFireDepartmentIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">kcal Woche</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>{weekKcal}</Typography>
          </CardContent>
        </Card>
        {/* Progress */}
        <Card sx={{ flex: 1, minWidth: 100 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <BarChartIcon color="primary" fontSize="small" />
              <Typography variant="caption" color="text.secondary">Woche</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {totalCompleted}/{totalTarget}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Exercise List */}
      {template.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Noch keine Wochenvorlage erstellt.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Erstelle zuerst Übungen unter "Übungen" und füge sie dann unter "Vorlage" hinzu.
          </Typography>
        </Card>
      ) : (
        template.map((t) => {
          const exercise = exerciseMap.get(t.exerciseId);
          if (!exercise) return null;
          return (
            <ExerciseCard
              key={t.id}
              exercise={exercise}
              completed={completionCounts.get(t.exerciseId) ?? 0}
              target={t.targetCount}
              completedDays={completedDaysMap.get(t.exerciseId) ?? []}
              onComplete={() => handleComplete(exercise)}
            />
          );
        })
      )}

      {/* Cardio Entries */}
      {cardioEntries.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Extra Kalorien
          </Typography>
          {cardioEntries.map((entry) => {
            const entryDay = new Date(entry.createdAt).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
            return (
              <Box key={entry.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography variant="body2">{entry.description}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Chip label={`${entry.kcal} kcal`} size="small" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">{entryDay}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => removeCardioEntry(entry.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Completion History */}
      {completions.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Erledigte Übungen diese Woche
          </Typography>
          {completions
            .sort((a, b) => b.completedAt - a.completedAt)
            .map((c) => {
              const ex = exerciseMap.get(c.exerciseId);
              return (
                <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography variant="body2">
                      {ex?.name ?? 'Unbekannt'} – {c.kcal} kcal
                      {c.weight ? ` (${c.weight} kg)` : ''}
                      {c.band ? ` (${c.band})` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.completedAt).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => removeCompletion(c.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
        </Box>
      )}

      {/* FAB for Cardio */}
      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 72, right: 16 }}
        onClick={() => setCardioOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Dialogs */}
      <CompletionDialog
        exercise={selectedExercise}
        open={completionOpen}
        onClose={() => {
          setCompletionOpen(false);
          setSelectedExercise(null);
        }}
      />
      <CardioDialog
        open={cardioOpen}
        onClose={() => setCardioOpen(false)}
      />
    </Box>
  );
}
