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
  updateTemplateOptional,
} from '../db/hooks';
import type { Exercise } from '../db/database';

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

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises.forEach((e) => map.set(e.id, e));
    return map;
  }, [exercises]);

  // Split by required/optional, then by type
  const requiredKraft = useMemo(
    () => template.filter((entry) => !entry.isOptional && exerciseMap.get(entry.exerciseId)?.type === 'kraft'),
    [template, exerciseMap],
  );
  const requiredPhysio = useMemo(
    () => template.filter((entry) => !entry.isOptional && exerciseMap.get(entry.exerciseId)?.type === 'physio'),
    [template, exerciseMap],
  );
  const optionalTemplate = useMemo(
    () => template.filter((entry) => entry.isOptional),
    [template],
  );

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

  const handleMove = async (index: number, direction: 'up' | 'down', entries: typeof template) => {
    const entry = entries[index];
    if (!entry) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= entries.length) return;

    const reordered = [...entries];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

    // Reconstruct full template order
    const otherEntries = template.filter((t) => !entries.some((e) => e.id === t.id));
    await reorderTemplate([...otherEntries, ...reordered]);
  };

  const handleUpdateTarget = async (exerciseId: string, newTarget: number) => {
    const entry = template.find((t) => t.exerciseId === exerciseId);
    if (entry) {
      await setTemplateEntry(
        exerciseId,
        Math.max(1, newTarget),
        entry.order,
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

  const handleUpdateOptional = async (exerciseId: string, nextKind: 'required' | 'optional' | null) => {
    if (!nextKind) return;
    const entry = template.find((item) => item.exerciseId === exerciseId);
    if (!entry) return;

    const nextIsOptional = nextKind === 'optional';
    if ((entry.isOptional ?? false) === nextIsOptional) return;

    await updateTemplateOptional(exerciseId, nextIsOptional);
    const allEntries = template.map((t) =>
      t.exerciseId === exerciseId ? { ...t, isOptional: nextIsOptional } : t,
    );
    const required = allEntries.filter((t) => !t.isOptional);
    const optional = allEntries.filter((t) => t.isOptional);
    await reorderTemplate([...required, ...optional]);
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

  const renderKraftEntry = (entry: typeof template[number], index: number, entries: typeof template) => {
    const ex = exerciseMap.get(entry.exerciseId);
    if (!ex) return null;
    return (
      <Card key={entry.id} sx={{ mb: 1.5 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <ListItem disablePadding>
            <ListItemText
              primary={<Typography fontWeight={600}>{ex.name}</Typography>}
              secondary={
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip label="Kraft" size="small" variant="outlined" />
                  <Chip label={`${ex.kcalPerCompletion} kcal`} size="small" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    1× pro Trainingstag
                  </Typography>
                </Box>
              }
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
              <IconButton size="small" onClick={() => handleMove(index, 'up', entries)} disabled={index === 0}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleMove(index, 'down', entries)} disabled={index === entries.length - 1}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
            <IconButton size="small" onClick={() => handleRemove(entry.exerciseId)} sx={{ ml: 0.5 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </ListItem>
          <Box sx={{ mt: 1 }}>
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
        </CardContent>
      </Card>
    );
  };

  const renderPhysioEntry = (entry: typeof template[number], index: number, entries: typeof template) => {
    const ex = exerciseMap.get(entry.exerciseId);
    if (!ex) return null;
    return (
      <Card key={entry.id} sx={{ mb: 1.5 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <ListItem disablePadding>
            <ListItemText
              primary={<Typography fontWeight={600}>{ex.name}</Typography>}
              secondary={
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip label="Physio" size="small" variant="outlined" />
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
              <IconButton size="small" onClick={() => handleMove(index, 'up', entries)} disabled={index === 0}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleMove(index, 'down', entries)} disabled={index === entries.length - 1}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
            <IconButton size="small" onClick={() => handleRemove(entry.exerciseId)} sx={{ ml: 0.5 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </ListItem>
          <Box sx={{ mt: 1 }}>
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
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Wochenvorlage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Kraft-Übungen erscheinen an Trainingstagen (1× abhaken). Physio-Übungen haben ein Wochen-Target.
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
        <>
          {/* Kraft Section */}
          {requiredKraft.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="overline" sx={{ display: 'block', mb: 0.75, color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
                Kraft (1× pro Trainingstag)
              </Typography>
              <List disablePadding>
                {requiredKraft.map((entry, index) => renderKraftEntry(entry, index, requiredKraft))}
              </List>
            </Box>
          )}

          {/* Physio Section */}
          {requiredPhysio.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="overline" sx={{ display: 'block', mb: 0.75, color: 'secondary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
                Physio (Wochen-Target)
              </Typography>
              <List disablePadding>
                {requiredPhysio.map((entry, index) => renderPhysioEntry(entry, index, requiredPhysio))}
              </List>
            </Box>
          )}

          {/* Optional Section */}
          {optionalTemplate.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Optionale Übungen
              </Typography>
              <List disablePadding>
                {optionalTemplate.map((entry, index) => {
                  const ex = exerciseMap.get(entry.exerciseId);
                  if (!ex) return null;
                  return ex.type === 'kraft'
                    ? renderKraftEntry(entry, index, optionalTemplate)
                    : renderPhysioEntry(entry, index, optionalTemplate);
                })}
              </List>
            </Box>
          )}
        </>
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
                ? 'Wähle Übungen für die Wochenvorlage aus.'
                : `${selectedExerciseIds.length} ausgewählt`}
            </Typography>
            <Button size="small" onClick={handleToggleSelectAll}>
              {selectedExerciseIds.length === availableExercises.length ? 'Alle abwählen' : 'Alle auswählen'}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Für Physio-Übungen: Wie oft pro Woche?
          </Typography>
          <TextField
            label="Wochen-Target (Physio)"
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
