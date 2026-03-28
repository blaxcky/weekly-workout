import { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useExercises, useWeeklyTemplate, useCompletions, useCardioEntries } from '../db/hooks';
import { getWeekId, formatWeekId, formatWeekRange } from '../utils/week';

export default function Stats() {
  const exercises = useExercises();
  const template = useWeeklyTemplate();
  const completions = useCompletions();
  const cardioEntries = useCardioEntries();
  const weekId = getWeekId();

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

  const exerciseKcal = completions.reduce((sum, c) => sum + c.kcal, 0);
  const cardioKcal = cardioEntries.reduce((sum, c) => sum + c.kcal, 0);
  const totalKcal = exerciseKcal + cardioKcal;

  const totalTarget = template.reduce((sum, t) => sum + t.targetCount, 0);
  const totalCompleted = template.reduce(
    (sum, t) => sum + Math.min(completionCounts.get(t.exerciseId) ?? 0, t.targetCount),
    0,
  );
  const overallProgress = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Wochenstatistik
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatWeekId(weekId)} • {formatWeekRange()}
      </Typography>

      {/* Total kcal */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocalFireDepartmentIcon color="error" />
            <Typography variant="h6" fontWeight={600}>Kalorien diese Woche</Typography>
          </Box>
          <Typography variant="h3" fontWeight={700} color="error.main">{totalKcal} kcal</Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Übungen: {exerciseKcal} kcal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cardio: {cardioKcal} kcal
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6" fontWeight={600}>Gesamtfortschritt</Typography>
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
            template.map((t) => {
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
                  {t !== template[template.length - 1] && <Divider sx={{ mt: 2 }} />}
                </Box>
              );
            })
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
