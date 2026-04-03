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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useExercises, useWeeklyTemplate, useCompletions, useCardioEntries } from '../db/hooks';
import { getWeekId, formatWeekId, formatWeekRange, getWeekRange, getDateKey, WEEKDAY_SHORT } from '../utils/week';

export default function Stats() {
  const exercises = useExercises();
  const template = useWeeklyTemplate();
  const completions = useCompletions();
  const cardioEntries = useCardioEntries();
  const weekId = getWeekId();
  const requiredTemplate = useMemo(
    () => template.filter((entry) => !entry.isOptional),
    [template],
  );
  const optionalTemplate = useMemo(
    () => template.filter((entry) => entry.isOptional),
    [template],
  );

  const exerciseMap = useMemo(() => {
    const map = new Map<string, string>();
    exercises.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [exercises]);

  const completionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    completions.forEach((c) => {
      counts.set(c.exerciseId, (counts.get(c.exerciseId) ?? 0) + 1);
    });
    return counts;
  }, [completions]);

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

  const totalTarget = requiredTemplate.reduce((sum, t) => sum + t.targetCount, 0);
  const totalCompleted = requiredTemplate.reduce(
    (sum, t) => sum + Math.min(completionCounts.get(t.exerciseId) ?? 0, t.targetCount),
    0,
  );
  const overallProgress = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;

  const renderExerciseProgressList = (entries: typeof template, title: string) => {
    if (entries.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {entries.map((t, index) => {
          const name = exerciseMap.get(t.exerciseId) ?? 'Unbekannt';
          const done = completionCounts.get(t.exerciseId) ?? 0;
          const capped = Math.min(done, t.targetCount);
          const pct = t.targetCount > 0 ? (capped / t.targetCount) * 100 : 0;
          return (
            <Box key={t.id} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>{name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {done}/{t.targetCount}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{ height: 6, borderRadius: 3 }}
                color={done >= t.targetCount ? 'success' : 'primary'}
              />
              {index < entries.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Wochenstatistik
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatWeekId(weekId)} • {formatWeekRange()}
      </Typography>

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

      {/* Overall Progress */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6" fontWeight={600}>Pflichtfortschritt</Typography>
          </Box>
          <Typography variant="h3" fontWeight={700} color="success.main">
            {totalCompleted}/{totalTarget}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            sx={{ height: 10, borderRadius: 5, mt: 1 }}
            color="success"
          />
        </CardContent>
      </Card>

      {/* Per-Exercise Breakdown */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FitnessCenterIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>Einzelne Übungen</Typography>
          </Box>
          {template.length === 0 ? (
            <Typography color="text.secondary">Keine Vorlage konfiguriert.</Typography>
          ) : (
            <>
              {requiredTemplate.length > 0 ? (
                renderExerciseProgressList(requiredTemplate, 'Pflichtübungen')
              ) : (
                <Typography color="text.secondary" sx={{ mb: optionalTemplate.length > 0 ? 2 : 0 }}>
                  Keine Pflichtübungen konfiguriert.
                </Typography>
              )}
              {renderExerciseProgressList(optionalTemplate, 'Optionale Übungen')}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
