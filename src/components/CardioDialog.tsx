import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { addCardioEntry } from '../db/hooks';

interface CardioDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CardioDialog({ open, onClose }: CardioDialogProps) {
  const [description, setDescription] = useState('');
  const [kcal, setKcal] = useState('');

  const handleSave = async () => {
    const k = parseInt(kcal);
    if (!description.trim() || !k || k <= 0) return;
    await addCardioEntry(description.trim(), k);
    setDescription('');
    setKcal('');
    onClose();
  };

  const handleClose = () => {
    setDescription('');
    setKcal('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Extra Kalorien eintragen</DialogTitle>
      <DialogContent>
        <TextField
          label="Beschreibung"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="z.B. 15 Min Seilspringen"
        />
        <TextField
          label="Kalorien (kcal)"
          type="number"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          fullWidth
          margin="normal"
          inputProps={{ min: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!description.trim() || !kcal || parseInt(kcal) <= 0}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
