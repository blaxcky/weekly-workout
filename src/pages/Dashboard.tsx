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
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CatchingPokemonIcon from '@mui/icons-material/CatchingPokemon';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useExercises, useWeeklyTemplate, useCompletions, useCardioEntries, removeCompletion, removeCardioEntry } from '../db/hooks';
import type { Exercise, WeeklyTemplateEntry } from '../db/database';
import ExerciseCard from '../components/ExerciseCard';
import CompletionDialog from '../components/CompletionDialog';
import CardioDialog from '../components/CardioDialog';
import CollapsibleSection from '../components/CollapsibleSection';
import WeekOverview from '../components/WeekOverview';
import { getWeekId, formatWeekId, formatWeekRange, getDateKey, getWeekdayIndex } from '../utils/week';
import { categorizeDashboard, getWeekDayStats } from '../utils/schedule';

export default function Dashboard() {
  const exercises = useExercises();
  const template = useWeeklyTemplate();
  const completions = useCompletions();
  const cardioEntries = useCardioEntries();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [cardioOpen, setCardioOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const weekId = getWeekId();
  const todayKey = getDateKey();

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises.forEach((e) => map.set(e.id, e));
    return map;
  }, [exercises]);
  const requiredTemplate = useMemo(
    () => template.filter((entry) => !entry.isOptional),
    [template],
  );
  const optionalTemplate = useMemo(
    () => template.filter((entry) => entry.isOptional),
    [template],
  );

  const completionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    completions.forEach((c) => {
      counts.set(c.exerciseId, (counts.get(c.exerciseId) ?? 0) + 1);
    });
    return counts;
  }, [completions]);

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

  // Smart categorization
  const categories = useMemo(
    () => categorizeDashboard(requiredTemplate, completions),
    [requiredTemplate, completions],
  );

  // Week overview stats
  const dayStats = useMemo(
    () => getWeekDayStats(requiredTemplate, completions),
    [requiredTemplate, completions],
  );

  // Daily kcal
  const todayExerciseKcal = completions
    .filter((c) => getDateKey(new Date(c.completedAt)) === todayKey)
    .reduce((sum, c) => sum + c.kcal, 0);
  const todayCardioKcal = cardioEntries
    .filter((c) => getDateKey(new Date(c.createdAt)) === todayKey)
    .reduce((sum, c) => sum + c.kcal, 0);
  const todayKcal = todayExerciseKcal + todayCardioKcal;

  // Weekly kcal
  const weekKcal = completions.reduce((sum, c) => sum + c.kcal, 0)
    + cardioEntries.reduce((sum, c) => sum + c.kcal, 0);

  const totalTarget = requiredTemplate.reduce((sum, t) => sum + t.targetCount, 0);
  const totalCompleted = requiredTemplate.reduce(
    (sum, t) => sum + Math.min(completionCounts.get(t.exerciseId) ?? 0, t.targetCount),
    0,
  );
  const allRequiredComplete = requiredTemplate.length > 0 && categories.weeklyComplete.length === requiredTemplate.length;

  const handleComplete = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCompletionOpen(true);
  };

  const renderExerciseCard = (t: (typeof template)[number]) => {
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
  };

  const renderExerciseTypeGroup = (
    title: string,
    entries: WeeklyTemplateEntry[],
    color: string,
  ) => {
    if (entries.length === 0) return null;

    return (
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="overline"
          sx={{ display: 'block', mb: 0.75, color, fontWeight: 700, letterSpacing: '0.08em' }}
        >
          {title}
        </Typography>
        {entries.map(renderExerciseCard)}
      </Box>
    );
  };

  const renderTypedExerciseList = (entries: WeeklyTemplateEntry[]) => {
    const physioEntries = entries.filter((entry) => exerciseMap.get(entry.exerciseId)?.type === 'physio');
    const strengthEntries = entries.filter((entry) => exerciseMap.get(entry.exerciseId)?.type === 'kraft');

    return (
      <>
        {renderExerciseTypeGroup('Physio', physioEntries, 'secondary.main')}
        {renderExerciseTypeGroup('Kraft', strengthEntries, 'primary.main')}
      </>
    );
  };

  const renderOptionalSection = () => {
    if (optionalTemplate.length === 0) return null;

    return (
      <CollapsibleSection
        title="Optionale Übungen"
        count={optionalTemplate.length}
        defaultExpanded={allRequiredComplete || requiredTemplate.length === 0}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {allRequiredComplete || requiredTemplate.length === 0
            ? 'Pflicht ist erledigt. Wenn du noch Energie hast, kannst du hier weitermachen.'
            : 'Für später, wenn die Pflichtübungen geschafft sind.'}
        </Typography>
        {renderTypedExerciseList(optionalTemplate)}
      </CollapsibleSection>
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

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, overflow: 'auto' }}>
        <Card sx={{ flex: 1, minWidth: 120 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LocalFireDepartmentIcon color="error" fontSize="small" />
              <Typography variant="caption" color="text.secondary">kcal heute</Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} color="error.main">{todayKcal}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 120 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LocalFireDepartmentIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">kcal Woche</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>{weekKcal}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 100 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <BarChartIcon color="primary" fontSize="small" />
              <Typography variant="caption" color="text.secondary">Pflicht</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {totalCompleted}/{totalTarget}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Week Overview */}
      {requiredTemplate.length > 0 && <WeekOverview dayStats={dayStats} />}

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

      {/* Show All Toggle */}
      {template.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            size="small"
            startIcon={showAll ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={() => setShowAll(!showAll)}
            sx={{ textTransform: 'none' }}
          >
            {showAll ? 'Smart-Ansicht' : 'Alle anzeigen'}
          </Button>
        </Box>
      )}

      {/* === SMART VIEW === */}
      {template.length > 0 && !showAll && (
        <>
          {/* Today's exercises */}
          {categories.todayTodo.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Heute dran
              </Typography>
              {renderTypedExerciseList(categories.todayTodo)}
            </Box>
          )}

          {/* Nothing to do today message */}
          {categories.todayTodo.length === 0 && categories.catchUp.length === 0 &&
            categories.doneToday.length === 0 && categories.weeklyComplete.length < requiredTemplate.length &&
            requiredTemplate.length > 0 && (
            <Card sx={{ p: 3, textAlign: 'center', mb: 2 }}>
              <Typography color="text.secondary">
                🎉 Heute nichts geplant!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Genieße den freien Tag oder schau unter "Alle anzeigen" nach offenen Übungen.
              </Typography>
            </Card>
          )}

          {/* All done for the week */}
          {allRequiredComplete && (
            <Card sx={{ p: 3, textAlign: 'center', mb: 2, border: '2px solid', borderColor: 'success.main' }}>
              <Typography variant="h6" color="success.main" fontWeight={700}>
                🏆 Alle Pflichtziele erreicht!
              </Typography>
            </Card>
          )}

          {/* Catch-up section */}
          {categories.catchUp.length > 0 && (
            <CollapsibleSection
              title="Aufholen"
              count={categories.catchUp.length}
              icon={<CatchingPokemonIcon fontSize="small" color="warning" />}
            >
              {renderTypedExerciseList(categories.catchUp)}
            </CollapsibleSection>
          )}

          {/* Done today */}
          {categories.doneToday.length > 0 && (
            <CollapsibleSection
              title="Heute erledigt"
              count={categories.doneToday.length}
              icon={<CheckCircleOutlineIcon fontSize="small" color="success" />}
            >
              {renderTypedExerciseList(categories.doneToday)}
            </CollapsibleSection>
          )}

          {/* Weekly complete */}
          {categories.weeklyComplete.length > 0 && categories.weeklyComplete.length < requiredTemplate.length && (
            <CollapsibleSection
              title="Wochenziel erreicht"
              count={categories.weeklyComplete.length}
              icon={<EmojiEventsIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
            >
              {renderTypedExerciseList(categories.weeklyComplete)}
            </CollapsibleSection>
          )}

          {renderOptionalSection()}
        </>
      )}

      {/* === SHOW ALL VIEW (legacy) === */}
      {template.length > 0 && showAll && (
        <>
          {requiredTemplate.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Pflichtübungen
              </Typography>
              {renderTypedExerciseList(requiredTemplate)}
            </Box>
          )}
          {renderOptionalSection()}
        </>
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
