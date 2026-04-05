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
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  useExercises,
  useWeeklyTemplate,
  useCompletions,
  useCardioEntries,
  useTrainingDays,
  useIsTrainingDay,
  toggleTrainingDay,
  removeCompletion,
  removeCardioEntry,
} from '../db/hooks';
import type { Exercise } from '../db/database';
import ExerciseCard from '../components/ExerciseCard';
import CompletionDialog from '../components/CompletionDialog';
import CardioDialog from '../components/CardioDialog';
import CollapsibleSection from '../components/CollapsibleSection';
import WeekOverview from '../components/WeekOverview';
import { getWeekId, formatWeekId, formatWeekRange, getDateKey, getWeekDateKeys } from '../utils/week';
import { categorizeKraft, categorizePhysio, getWeekDayStats, getTrainingDayCount } from '../utils/schedule';

export default function Dashboard() {
  const exercises = useExercises();
  const template = useWeeklyTemplate();
  const completions = useCompletions();
  const cardioEntries = useCardioEntries();
  const trainingDays = useTrainingDays();
  const trainingDayEntry = useIsTrainingDay();
  const isTrainingDay = !!trainingDayEntry;
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [cardioOpen, setCardioOpen] = useState(false);

  const weekId = getWeekId();
  const todayKey = getDateKey();
  const weekDateKeys = useMemo(() => getWeekDateKeys(), []);

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises.forEach((e) => map.set(e.id, e));
    return map;
  }, [exercises]);

  // Split template by type
  const kraftTemplate = useMemo(
    () => template.filter((entry) => !entry.isOptional && exerciseMap.get(entry.exerciseId)?.type === 'kraft'),
    [template, exerciseMap],
  );
  const physioTemplate = useMemo(
    () => template.filter((entry) => !entry.isOptional && exerciseMap.get(entry.exerciseId)?.type === 'physio'),
    [template, exerciseMap],
  );
  const optionalTemplate = useMemo(
    () => template.filter((entry) => entry.isOptional),
    [template],
  );

  // Categorize
  const kraft = useMemo(
    () => categorizeKraft(kraftTemplate, completions),
    [kraftTemplate, completions],
  );
  const physio = useMemo(
    () => categorizePhysio(physioTemplate, completions),
    [physioTemplate, completions],
  );

  // Week overview stats
  const dayStats = useMemo(
    () => getWeekDayStats(kraftTemplate, completions, trainingDays, exerciseMap, weekDateKeys),
    [kraftTemplate, completions, trainingDays, exerciseMap, weekDateKeys],
  );

  const trainingDayCount = getTrainingDayCount(trainingDays);

  // Daily kcal
  const todayExerciseKcal = completions
    .filter((c) => getDateKey(new Date(c.completedAt)) === todayKey)
    .reduce((sum, c) => sum + c.kcal, 0);
  const todayCardioKcal = cardioEntries
    .filter((c) => getDateKey(new Date(c.createdAt)) === todayKey)
    .reduce((sum, c) => sum + c.kcal, 0);
  const todayKcal = todayExerciseKcal + todayCardioKcal;

  const weekKcal = completions.reduce((sum, c) => sum + c.kcal, 0)
    + cardioEntries.reduce((sum, c) => sum + c.kcal, 0);

  const allKraftDoneToday = kraftTemplate.length > 0 && kraft.todo.length === 0;
  const allPhysioDoneWeek = physioTemplate.length > 0 && physio.todo.length === 0;

  const handleToggleTrainingDay = async () => {
    await toggleTrainingDay();
  };

  const handleComplete = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCompletionOpen(true);
  };

  const renderKraftCard = (t: typeof template[number]) => {
    const exercise = exerciseMap.get(t.exerciseId);
    if (!exercise) return null;
    const doneToday = kraft.done.some((d) => d.exerciseId === t.exerciseId);
    return (
      <ExerciseCard
        key={t.id}
        exercise={exercise}
        mode="kraft"
        doneToday={doneToday}
        onComplete={() => handleComplete(exercise)}
      />
    );
  };

  const renderPhysioCard = (t: typeof template[number]) => {
    const exercise = exerciseMap.get(t.exerciseId);
    if (!exercise) return null;
    const weekCount = physio.weekCounts.get(t.exerciseId) ?? 0;
    return (
      <ExerciseCard
        key={t.id}
        exercise={exercise}
        mode="physio"
        weekCount={weekCount}
        weekTarget={t.targetCount}
        onComplete={() => handleComplete(exercise)}
      />
    );
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

      {/* Stats Row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, overflow: 'auto' }}>
        <Card sx={{ flex: 1, minWidth: 100 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LocalFireDepartmentIcon color="error" fontSize="small" />
              <Typography variant="caption" color="text.secondary">kcal heute</Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} color="error.main">{todayKcal}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 100 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LocalFireDepartmentIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">kcal Woche</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>{weekKcal}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Week Overview */}
      {(kraftTemplate.length > 0 || physioTemplate.length > 0) && (
        <CollapsibleSection title="Wochenübersicht" defaultExpanded={false}>
          <WeekOverview dayStats={dayStats} />
        </CollapsibleSection>
      )}

      {/* Training Day Toggle */}
      {template.length > 0 && (
        <Card
          sx={{
            mb: 2,
            border: '2px solid',
            borderColor: isTrainingDay ? 'primary.main' : 'divider',
            bgcolor: isTrainingDay ? 'primary.main' : 'background.paper',
            transition: 'all 0.3s',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>💪</Typography>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ color: isTrainingDay ? 'primary.contrastText' : 'text.primary' }}
                  >
                    Heute ist Trainingstag
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: isTrainingDay ? 'primary.contrastText' : 'text.secondary', opacity: 0.8 }}
                  >
                    {trainingDayCount} diese Woche
                  </Typography>
                </Box>
              </Box>
              <Switch
                checked={isTrainingDay}
                onChange={handleToggleTrainingDay}
                color="default"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#fff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: 'rgba(255,255,255,0.5)',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {template.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Noch keine Wochenvorlage erstellt.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Erstelle zuerst Übungen unter "Übungen" und füge sie dann unter "Vorlage" hinzu.
          </Typography>
        </Card>
      )}

      {/* Kraft Section – only when training day is ON */}
      {isTrainingDay && kraftTemplate.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FitnessCenterIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
              Kraft-Übungen
            </Typography>
            {allKraftDoneToday && (
              <Chip label="✓ Alle erledigt" size="small" color="success" />
            )}
          </Box>
          {kraft.todo.map(renderKraftCard)}
          {kraft.done.length > 0 && kraft.todo.length > 0 && (
            <Divider sx={{ my: 1 }} />
          )}
          {kraft.done.map(renderKraftCard)}
        </Box>
      )}

      {/* Physio Section – always visible */}
      {physioTemplate.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SelfImprovementIcon color="secondary" fontSize="small" />
            <Typography variant="subtitle2" color="secondary.main" fontWeight={700}>
              Physio
            </Typography>
            {allPhysioDoneWeek && (
              <Chip label="✓ Wochenziel" size="small" color="success" />
            )}
          </Box>
          {physio.todo.map(renderPhysioCard)}
          {physio.done.length > 0 && (
            <CollapsibleSection
              title="Wochenziel erreicht"
              count={physio.done.length}
              icon={<EmojiEventsIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
            >
              {physio.done.map(renderPhysioCard)}
            </CollapsibleSection>
          )}
        </Box>
      )}

      {/* Optional Exercises */}
      {optionalTemplate.length > 0 && (
        <CollapsibleSection
          title="Optionale Übungen"
          count={optionalTemplate.length}
          defaultExpanded={false}
        >
          {optionalTemplate.map((t) => {
            const exercise = exerciseMap.get(t.exerciseId);
            if (!exercise) return null;
            const weekCount = completions.filter((c) => c.exerciseId === t.exerciseId).length;
            return (
              <ExerciseCard
                key={t.id}
                exercise={exercise}
                mode={exercise.type === 'kraft' ? 'kraft' : 'physio'}
                doneToday={exercise.type === 'kraft' ? completions.some(
                  (c) => c.exerciseId === t.exerciseId && getDateKey(new Date(c.completedAt)) === todayKey,
                ) : undefined}
                weekCount={exercise.type === 'physio' ? weekCount : undefined}
                weekTarget={exercise.type === 'physio' ? t.targetCount : undefined}
                onComplete={() => handleComplete(exercise)}
              />
            );
          })}
        </CollapsibleSection>
      )}

      {/* All done for the week */}
      {allKraftDoneToday && allPhysioDoneWeek && isTrainingDay && (
        <Card sx={{ p: 3, textAlign: 'center', mb: 2, border: '2px solid', borderColor: 'success.main' }}>
          <Typography variant="h6" color="success.main" fontWeight={700}>
            🏆 Alles erledigt!
          </Typography>
        </Card>
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
          <CollapsibleSection title="Erledigte Übungen diese Woche" count={completions.length}>
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
          </CollapsibleSection>
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
        key={selectedExercise?.id ?? 'empty'}
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
