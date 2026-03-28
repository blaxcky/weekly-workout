import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
  MenuItem,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  useExercises,
  useWeeklyTemplate,
  setTemplateEntry,
  removeTemplateEntry,
  reorderTemplate,
} from '../db/hooks';
import type { Exercise } from '../db/database';

export default function Template() {
  const exercises = useExercises();
  const template = useWeeklyTemplate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [targetCount, setTargetCount] = useState('3');

  const templateExerciseIds = new Set(template.map((t) => t.exerciseId));
  const availableExercises = exercises.filter((e) => !templateExerciseIds.has(e.id));

  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach((e) => exerciseMap.set(e.id, e));

  const handleAdd = async () => {
    if (!selectedExercise || !targetCount) return;
    const maxOrder = template.length > 0 ? Math.max(...template.map((t) => t.order)) + 1 : 0;
    await setTemplateEntry(selectedExercise, parseInt(targetCount) || 3, maxOrder);
    setSelectedExercise('');
    setTargetCount('3');
    setAddDialogOpen(false);
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
      await setTemplateEntry(exerciseId, Math.max(1, newTarget), entry.order);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Wochenvorlage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Lege fest, welche Übungen du pro Woche machen willst.
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
                          <Chip label={`${ex.kcalPerCompletion} kcal`} size="small" variant="outlined" />
                          <TextField
                            type="number"
                            value={entry.targetCount}
                            onChange={(e) => handleUpdateTarget(entry.exerciseId, parseInt(e.target.value) || 1)}
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
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Übung zur Vorlage hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            label="Übung"
            select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            fullWidth
            margin="normal"
          >
            {availableExercises.map((ex) => (
              <MenuItem key={ex.id} value={ex.id}>
                {ex.name} ({ex.type === 'kraft' ? 'Kraft' : 'Physio'})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Wie oft pro Woche?"
            type="number"
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: 14 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleAdd} variant="contained" disabled={!selectedExercise}>
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
