import { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import {
  useExercises,
  useWeeklyTemplate,
  useCompletions,
  useCardioEntries,
  useTrainingDays,
} from '../db/hooks';
import { getWeekId, formatWeekId, formatWeekRange, getWeekRange, getDateKey, WEEKDAY_SHORT } from '../utils/week';
import type { Exercise } from '../db/database';

export default function Stats() {
  const exercises = useExercises();
  const template = useWeeklyTemplate();
  const completions = useCompletions();
  const cardioEntries = useCardioEntries();
  const trainingDays = useTrainingDays();
  const weekId = getWeekId();

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises.forEach((e) => map.set(e.id, e));
    return map;
  }, [exercises]);

  const exerciseNameMap = useMemo(() => {
    const map = new Map<string, string>();
    exercises.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [exercises]);

  const kraftTemplate = useMemo(
    () => template.filter((entry) => !entry.isOptional && exerciseMap.get(entry.exerciseId)?.type === 'kraft'),
    [template, exerciseMap],
  );
  const physioTemplate = useMemo(
    () => template.filter((entry) => !entry.isOptional && exerciseMap.get(entry.exerciseId)?.type === 'physio'),
    [template, exerciseMap],
  );

  const completionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    completions.forEach((c) => {
      counts.set(c.exerciseId, (counts.get(c.exerciseId) ?? 0) + 1);
    });
    return counts;
  }, [completions]);

  // Count how many training days each kraft exercise was completed on
  const kraftDaysCounts = useMemo(() => {
    const counts = new Map<string, Set<string>>();
    completions.forEach((c) => {
      const ex = exerciseMap.get(c.exerciseId);
      if (ex?.type !== 'kraft') return;
      const dateKey = getDateKey(new Date(c.completedAt));
      if (!counts.has(c.exerciseId)) counts.set(c.exerciseId, new Set());
      counts.get(c.exerciseId)!.add(dateKey);
    });
    return counts;
  }, [completions, exerciseMap]);

  // Daily kcal breakdown (Mo–So)
  const dailyKcal = useMemo(() => {
    const { monday } = getWeekRange();
    const days: { label: string; date: string; kcal: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = getDateKey(d);
      const exKcal = completions
        .filter((c) => getDateKey(new Date(c.completedAt)) === key)
        .reduce((sum, c) => sum + c.kcal, 0);
      const cardKcal = cardioEntries
        .filter((c) => getDateKey(new Date(c.createdAt)) === key)
        .reduce((sum, c) => sum + c.kcal, 0);
      days.push({
        label: WEEKDAY_SHORT[i],
        date: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`,
        kcal: exKcal + cardKcal,
      });
    }
    return days;
  }, [completions, cardioEntries]);

  const weekExerciseKcal = completions.reduce((sum, c) => sum + c.kcal, 0);
  const weekCardioKcal = cardioEntries.reduce((sum, c) => sum + c.kcal, 0);
  const weekKcal = weekExerciseKcal + weekCardioKcal;
  const maxDayKcal = Math.max(...dailyKcal.map((d) => d.kcal), 1);

  const trainingDayCount = trainingDays.length;
  const trainingDateSet = useMemo(() => new Set(trainingDays.map((td) => td.date)), [trainingDays]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Wochenstatistik
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatWeekId(weekId)} • {formatWeekRange()}
      </Typography>

      {/* Training Days Overview */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <EventAvailableIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>Trainingstage</Typography>
          </Box>
          <Typography variant="h3" fontWeight={700} color="primary.main">
            {trainingDayCount}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Trainingstage diese Woche
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {WEEKDAY_SHORT.map((day, i) => {
              const { monday } = getWeekRange();
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              const dateKey = getDateKey(d);
              const isTrainingDay = trainingDateSet.has(dateKey);
              return (
                <Box
                  key={day}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: isTrainingDay ? 'primary.main' : 'action.hover',
                    color: isTrainingDay ? 'primary.contrastText' : 'text.disabled',
                  }}
                >
                  <Typography variant="caption" fontWeight={isTrainingDay ? 700 : 400} sx={{ fontSize: '0.65rem' }}>
                    {day}
                  </Typography>
                  {isTrainingDay && (
                    <Typography sx={{ fontSize: '0.7rem' }}>💪</Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Daily kcal breakdown */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TodayIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>Kalorien pro Tag</Typography>
          </Box>
          {dailyKcal.map((day) => {
            const isToday = day.date === `${String(new Date().getDate()).padStart(2, '0')}.${String(new Date().getMonth() + 1).padStart(2, '0')}.`;
            return (
              <Box key={day.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ width: 28, fontWeight: isToday ? 700 : 400, color: isToday ? 'primary.main' : 'text.secondary' }}
                >
                  {day.label}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(day.kcal / maxDayKcal) * 100}
                    sx={{ height: 14, borderRadius: 7, bgcolor: 'action.hover' }}
                    color={isToday ? 'primary' : 'inherit'}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ width: 60, textAlign: 'right', fontWeight: isToday ? 700 : 400 }}
                >
                  {day.kcal} kcal
                </Typography>
              </Box>
            );
          })}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={600}>Woche gesamt</Typography>
            <Typography variant="body2" fontWeight={700}>{weekKcal} kcal</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Übungen: {weekExerciseKcal} kcal
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cardio: {weekCardioKcal} kcal
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Kraft Progress */}
      {kraftTemplate.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FitnessCenterIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>Kraft</Typography>
            </Box>
            {kraftTemplate.map((t, index) => {
              const name = exerciseNameMap.get(t.exerciseId) ?? 'Unbekannt';
              const daysCompleted = kraftDaysCounts.get(t.exerciseId)?.size ?? 0;
              const pct = trainingDayCount > 0 ? Math.min((daysCompleted / trainingDayCount) * 100, 100) : 0;
              return (
                <Box key={t.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {daysCompleted}/{trainingDayCount} Trainingstage
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 6, borderRadius: 3 }}
                    color={daysCompleted >= trainingDayCount && trainingDayCount > 0 ? 'success' : 'primary'}
                  />
                  {index < kraftTemplate.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Physio Progress */}
      {physioTemplate.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SelfImprovementIcon color="secondary" />
              <Typography variant="h6" fontWeight={600}>Physio</Typography>
            </Box>
            {physioTemplate.map((t, index) => {
              const name = exerciseNameMap.get(t.exerciseId) ?? 'Unbekannt';
              const done = completionCounts.get(t.exerciseId) ?? 0;
              const capped = Math.min(done, t.targetCount);
              const pct = t.targetCount > 0 ? (capped / t.targetCount) * 100 : 0;
              return (
                <Box key={t.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {done}/{t.targetCount} pro Woche
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 6, borderRadius: 3 }}
                    color={done >= t.targetCount ? 'success' : 'secondary'}
                  />
                  {index < physioTemplate.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {template.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Keine Vorlage konfiguriert.</Typography>
        </Card>
      )}
    </Box>
  );
}
