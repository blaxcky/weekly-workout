import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Checkbox,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  useExercises,
  useWeeklyTemplate,
  addTemplateEntries,
  setTemplateEntry,
  removeTemplateEntry,
  reorderTemplate,
  updateTemplateScheduledDays,
  updateTemplateOptional,
} from '../db/hooks';
import type { Exercise } from '../db/database';
import { WEEKDAY_SHORT } from '../utils/week';
import { buildScheduledDaysMap, getScheduledDays } from '../utils/schedule';

export default function Template() {
  const exercises = useExercises();
  const template = useWeeklyTemplate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [targetCount, setTargetCount] = useState('3');
  const [targetDrafts, setTargetDrafts] = useState<Record<string, string>>({});
  const [newEntryKind, setNewEntryKind] = useState<'required' | 'optional'>('required');

  const templateExerciseIds = new Set(template.map((t) => t.exerciseId));
  const availableExercises = exercises.filter((e) => !templateExerciseIds.has(e.id));
  const requiredTemplate = useMemo(
    () => template.filter((entry) => !entry.isOptional),
    [template],
  );
  const optionalTemplate = useMemo(
    () => template.filter((entry) => entry.isOptional),
    [template],
  );
  const requiredScheduledDaysMap = useMemo(
    () => buildScheduledDaysMap(requiredTemplate),
    [requiredTemplate],
  );
  const optionalScheduledDaysMap = useMemo(
    () => buildScheduledDaysMap(optionalTemplate),
    [optionalTemplate],
  );

  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach((e) => exerciseMap.set(e.id, e));

  const resetAddDialog = () => {
    setSelectedExerciseIds([]);
    setTargetCount('3');
    setNewEntryKind('required');
    setAddDialogOpen(false);
  };

  const handleAdd = async () => {
    if (selectedExerciseIds.length === 0 || !targetCount) return;
    const maxOrder = template.length > 0 ? Math.max(...template.map((t) => t.order)) + 1 : 0;
    const orderedSelection = availableExercises
      .filter((exercise) => selectedExerciseIds.includes(exercise.id))
      .map((exercise) => exercise.id);
    await addTemplateEntries(
      orderedSelection,
      parseInt(targetCount) || 3,
      maxOrder,
      newEntryKind === 'optional',
    );
    resetAddDialog();
  };

  const handleRemove = async (exerciseId: string) => {
    await removeTemplateEntry(exerciseId);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newTemplate = [...template];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newTemplate.length) return;
    [newTemplate[index], newTemplate[swapIndex]] = [newTemplate[swapIndex], newTemplate[index]];
    await reorderTemplate(newTemplate);
  };

  const handleUpdateTarget = async (exerciseId: string, newTarget: number) => {
    const entry = template.find((t) => t.exerciseId === exerciseId);
    if (entry) {
      await setTemplateEntry(
        exerciseId,
        Math.max(1, newTarget),
        entry.order,
        entry.scheduledDays,
        entry.isOptional ?? false,
      );
    }
  };

  const handleTargetDraftChange = (exerciseId: string, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setTargetDrafts((current) => ({
      ...current,
      [exerciseId]: value,
    }));
  };

  const commitTargetDraft = async (exerciseId: string) => {
    const entry = template.find((t) => t.exerciseId === exerciseId);
    if (!entry) return;

    const draftValue = targetDrafts[exerciseId];
    if (draftValue === undefined) return;

    const nextTarget = Math.max(1, parseInt(draftValue, 10) || 1);

    setTargetDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[exerciseId];
      return nextDrafts;
    });

    if (nextTarget !== entry.targetCount) {
      await handleUpdateTarget(exerciseId, nextTarget);
    }
  };

  const handleToggleDay = async (exerciseId: string, dayIndex: number) => {
    const entry = template.find((t) => t.exerciseId === exerciseId);
    if (!entry) return;
    const current = entry.scheduledDays ?? [];
    const updated = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex].sort((a, b) => a - b);
    await updateTemplateScheduledDays(exerciseId, updated.length > 0 ? updated : undefined);
  };

  const handleClearDays = async (exerciseId: string) => {
    await updateTemplateScheduledDays(exerciseId, undefined);
  };

  const handleUpdateOptional = async (exerciseId: string, nextKind: 'required' | 'optional' | null) => {
    if (!nextKind) return;
    await updateTemplateOptional(exerciseId, nextKind === 'optional');
  };

  const handleToggleSelection = (exerciseId: string) => {
    setSelectedExerciseIds((current) => (
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId]
    ));
  };

  const handleToggleSelectAll = () => {
    setSelectedExerciseIds((current) => (
      current.length === availableExercises.length ? [] : availableExercises.map((exercise) => exercise.id)
    ));
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Wochenvorlage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Lege fest, welche Übungen du pro Woche machen willst.
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Auto verteilt nur auf Mo-Fr. Samstag und Sonntag bleiben als Puffertage frei, außer du planst sie manuell.
      </Typography>

      {template.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Noch keine Übungen in der Vorlage.
          </Typography>
          {exercises.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Erstelle zuerst Übungen unter "Übungen".
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Tippe auf + um Übungen hinzuzufügen.
            </Typography>
          )}
        </Card>
      ) : (
        <List disablePadding>
          {template.map((entry, index) => {
            const ex = exerciseMap.get(entry.exerciseId);
            if (!ex) return null;
            return (
              <Card key={entry.id} sx={{ mb: 1.5 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <ListItem disablePadding>
                    <ListItemText
                      primary={
                        <Typography fontWeight={600}>{ex.name}</Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip label={ex.type === 'kraft' ? 'Kraft' : 'Physio'} size="small" variant="outlined" />
                          <Chip
                            label={entry.isOptional ? 'Optional' : 'Pflicht'}
                            size="small"
                            color={entry.isOptional ? 'default' : 'success'}
                            variant={entry.isOptional ? 'outlined' : 'filled'}
                          />
                          <Chip label={`${ex.kcalPerCompletion} kcal`} size="small" variant="outlined" />
                          <TextField
                            type="number"
                            value={targetDrafts[entry.exerciseId] ?? entry.targetCount.toString()}
                            onChange={(e) => handleTargetDraftChange(entry.exerciseId, e.target.value)}
                            onBlur={() => {
                              void commitTargetDraft(entry.exerciseId);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void commitTargetDraft(entry.exerciseId);
                              }
                            }}
                            size="small"
                            label="x/Woche"
                            sx={{ width: 90 }}
                            inputProps={{ min: 1, max: 14 }}
                          />
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                      <IconButton size="small" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleMove(index, 'down')} disabled={index === template.length - 1}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <IconButton size="small" onClick={() => handleRemove(entry.exerciseId)} sx={{ ml: 0.5 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {/* Day schedule toggles */}
                  <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={entry.isOptional ? 'optional' : 'required'}
                        onChange={(_, value: 'required' | 'optional' | null) => {
                          void handleUpdateOptional(entry.exerciseId, value);
                        }}
                      >
                        <ToggleButton value="required">Pflicht</ToggleButton>
                        <ToggleButton value="optional">Optional</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tage:
                      </Typography>
                      {entry.scheduledDays && entry.scheduledDays.length > 0 ? (
                        <Chip
                          label="Auto"
                          size="small"
                          variant="outlined"
                          onClick={() => handleClearDays(entry.exerciseId)}
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          automatisch ({getScheduledDays(
                            entry,
                            entry.isOptional ? optionalScheduledDaysMap : requiredScheduledDaysMap,
                          ).map((d) => WEEKDAY_SHORT[d]).join(', ')})
                        </Typography>
                      )}
                    </Box>
                    <ToggleButtonGroup
                      size="small"
                      value={entry.scheduledDays ?? []}
                      sx={{ flexWrap: 'wrap', gap: 0.5 }}
                    >
                      {WEEKDAY_SHORT.map((day, i) => (
                        <ToggleButton
                          key={day}
                          value={i}
                          onClick={() => handleToggleDay(entry.exerciseId, i)}
                          selected={(entry.scheduledDays ?? []).includes(i)}
                          sx={{
                            px: 1,
                            py: 0.25,
                            fontSize: '0.7rem',
                            minWidth: 36,
                            borderRadius: '12px !important',
                            border: '1px solid !important',
                            borderColor: 'divider !important',
                          }}
                        >
                          {day}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </List>
      )}

      {/* Add FAB */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 72, right: 16 }}
        onClick={() => setAddDialogOpen(true)}
        disabled={availableExercises.length === 0}
      >
        <AddIcon />
      </Fab>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={resetAddDialog} fullWidth maxWidth="xs">
        <DialogTitle>Übungen zur Vorlage hinzufügen</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mt: 1,
              mb: 1.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {selectedExerciseIds.length === 0
                ? 'Wähle mehrere Übungen für die Wochenvorlage aus.'
                : `${selectedExerciseIds.length} ausgewählt`}
            </Typography>
            <Button size="small" onClick={handleToggleSelectAll}>
              {selectedExerciseIds.length === availableExercises.length ? 'Alle abwählen' : 'Alle auswählen'}
            </Button>
          </Box>
          <TextField
            label="Wie oft pro Woche?"
            type="number"
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: 14 }}
          />
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Kategorie
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={newEntryKind}
              onChange={(_, value: 'required' | 'optional' | null) => {
                if (value) setNewEntryKind(value);
              }}
            >
              <ToggleButton value="required">Pflicht</ToggleButton>
              <ToggleButton value="optional">Optional</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <List
            disablePadding
            sx={{
              mt: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            {availableExercises.map((ex, index) => {
              const selected = selectedExerciseIds.includes(ex.id);
              return (
                <ListItem
                  key={ex.id}
                  disablePadding
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      checked={selected}
                      onChange={() => handleToggleSelection(ex.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  }
                  sx={{
                    borderBottom: index < availableExercises.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemButton onClick={() => handleToggleSelection(ex.id)}>
                    <ListItemText
                      primary={ex.name}
                      secondary={`${ex.type === 'kraft' ? 'Kraft' : 'Physio'} • ${ex.kcalPerCompletion} kcal`}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetAddDialog}>Abbrechen</Button>
          <Button onClick={handleAdd} variant="contained" disabled={selectedExerciseIds.length === 0}>
            {selectedExerciseIds.length <= 1
              ? 'Hinzufügen'
              : `${selectedExerciseIds.length} hinzufügen`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
