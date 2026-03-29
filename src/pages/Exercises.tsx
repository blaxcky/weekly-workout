import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import { useExercises, addExercise, updateExercise, deleteExercise } from '../db/hooks';
import type { Exercise } from '../db/database';
import {
  EQUIPMENT_OPTIONS,
  getEquipmentLabel,
  toEditableEquipment,
  usesBandInput,
  usesWeightInput,
} from '../utils/equipment';

const EMPTY_FORM = {
  name: '',
  type: 'kraft' as Exercise['type'],
  equipment: 'kurzhantel' as Exercise['equipment'],
  defaultWeight: '',
  defaultBand: '',
  kcalPerCompletion: '',
  notes: '',
};

export default function Exercises() {
  const exercises = useExercises();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setForm({
      name: ex.name,
      type: ex.type,
      equipment: toEditableEquipment(ex.equipment),
      defaultWeight: ex.defaultWeight?.toString() ?? '',
      defaultBand: ex.defaultBand ?? '',
      kcalPerCompletion: ex.kcalPerCompletion.toString(),
      notes: ex.notes ?? '',
    });
    setEditingId(ex.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.kcalPerCompletion) return;
    const data = {
      name: form.name.trim(),
      type: form.type,
      equipment: form.equipment,
      defaultWeight: usesWeightInput(form.equipment) ? parseFloat(form.defaultWeight) || undefined : undefined,
      defaultBand: usesBandInput(form.equipment) ? form.defaultBand || undefined : undefined,
      kcalPerCompletion: parseInt(form.kcalPerCompletion) || 0,
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      await updateExercise(editingId, data);
    } else {
      await addExercise(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteExercise(id);
    setDeleteConfirm(null);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Übungen
      </Typography>

      {exercises.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Noch keine Übungen erstellt.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tippe auf + um eine Übung hinzuzufügen.
          </Typography>
        </Card>
      ) : (
        <List disablePadding>
          {exercises.map((ex) => (
            <Card key={ex.id} sx={{ mb: 1.5 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <ListItem disablePadding>
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                    {ex.type === 'kraft' ? (
                      <FitnessCenterIcon color="primary" />
                    ) : (
                      <SelfImprovementIcon color="secondary" />
                    )}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography fontWeight={600}>{ex.name}</Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={ex.type === 'kraft' ? 'Kraft' : 'Physio'} size="small" variant="outlined" />
                        <Chip label={getEquipmentLabel(ex.equipment)} size="small" variant="outlined" />
                        <Chip label={`${ex.kcalPerCompletion} kcal`} size="small" variant="outlined" />
                        {usesWeightInput(ex.equipment) && ex.defaultWeight && (
                          <Chip label={`${ex.defaultWeight} kg`} size="small" color="primary" variant="outlined" />
                        )}
                        {usesBandInput(ex.equipment) && ex.defaultBand && (
                          <Chip label={ex.defaultBand} size="small" color="secondary" variant="outlined" />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => openEdit(ex)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteConfirm(ex.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      {/* Create FAB */}
      <Fab color="primary" sx={{ position: 'fixed', bottom: 72, right: 16 }} onClick={openCreate}>
        <AddIcon />
      </Fab>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingId ? 'Übung bearbeiten' : 'Neue Übung'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            margin="normal"
            placeholder="z.B. Schulterdrücken"
          />
          <TextField
            label="Typ"
            select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Exercise['type'] })}
            fullWidth
            margin="normal"
          >
            <MenuItem value="kraft">Kraft</MenuItem>
            <MenuItem value="physio">Physio</MenuItem>
          </TextField>
          <TextField
            label="Equipment"
            select
            value={form.equipment}
            onChange={(e) => setForm({ ...form, equipment: e.target.value as Exercise['equipment'] })}
            fullWidth
            margin="normal"
          >
            {EQUIPMENT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {usesWeightInput(form.equipment) && (
            <TextField
              label="Standard-Gewicht (kg)"
              type="number"
              value={form.defaultWeight}
              onChange={(e) => setForm({ ...form, defaultWeight: e.target.value })}
              fullWidth
              margin="normal"
              inputProps={{ step: 0.5, min: 0 }}
            />
          )}
          {usesBandInput(form.equipment) && (
            <TextField
              label="Standard-Theraband"
              value={form.defaultBand}
              onChange={(e) => setForm({ ...form, defaultBand: e.target.value })}
              fullWidth
              margin="normal"
              placeholder="z.B. rot, mittel"
            />
          )}
          <TextField
            label="Kalorien pro Durchführung (kcal)"
            type="number"
            value={form.kcalPerCompletion}
            onChange={(e) => setForm({ ...form, kcalPerCompletion: e.target.value })}
            fullWidth
            margin="normal"
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Notizen (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!form.name.trim() || !form.kcalPerCompletion}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Übung löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Die Übung wird auch aus der Wochenvorlage entfernt. Bereits erledigte Einträge bleiben erhalten.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Abbrechen</Button>
          <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
