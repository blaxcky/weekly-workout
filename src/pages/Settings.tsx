import { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CachedIcon from '@mui/icons-material/Cached';
import InfoIcon from '@mui/icons-material/Info';
import { exportAllData, importAllData, downloadJson, readJsonFile } from '../db/export-import';

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Settings({ darkMode, onToggleDarkMode }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      downloadJson(data);
      setSnackbar({ message: 'Daten erfolgreich exportiert!', severity: 'success' });
    } catch {
      setSnackbar({ message: 'Export fehlgeschlagen.', severity: 'error' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readJsonFile(file);
      await importAllData(data);
      setSnackbar({ message: 'Daten erfolgreich importiert!', severity: 'success' });
    } catch (err) {
      setSnackbar({ message: `Import fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`, severity: 'error' });
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCacheReset = async () => {
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
      setResetDialogOpen(false);
      setSnackbar({ message: 'Cache zurückgesetzt! Seite wird neu geladen...', severity: 'success' });
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setSnackbar({ message: 'Cache-Reset fehlgeschlagen.', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Einstellungen
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            {/* Dark Mode */}
            <ListItem>
              <DarkModeIcon sx={{ mr: 2 }} color="action" />
              <ListItemText primary="Dark Mode" secondary="Dunkles Farbschema verwenden" />
              <ListItemSecondaryAction>
                <Switch checked={darkMode} onChange={onToggleDarkMode} />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />

            {/* Export */}
            <ListItem>
              <FileDownloadIcon sx={{ mr: 2 }} color="action" />
              <ListItemText primary="Daten exportieren" secondary="Alle Daten als JSON speichern" />
              <ListItemSecondaryAction>
                <Button variant="outlined" size="small" onClick={handleExport}>
                  Export
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />

            {/* Import */}
            <ListItem>
              <FileUploadIcon sx={{ mr: 2 }} color="action" />
              <ListItemText
                primary="Daten importieren"
                secondary="JSON-Backup wiederherstellen (überschreibt aktuelle Daten)"
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" size="small" onClick={() => fileInputRef.current?.click()}>
                  Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleImport}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />

            {/* Cache Reset */}
            <ListItem
              sx={{
                alignItems: { xs: 'flex-start', sm: 'center' },
                columnGap: 2,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                py: 1.5,
              }}
            >
              <CachedIcon sx={{ mt: { xs: 0.5, sm: 0 } }} color="action" />
              <ListItemText
                primary="Cache zurücksetzen"
                secondary="Service Worker & Cache löschen, Daten bleiben erhalten"
                sx={{
                  flex: '1 1 220px',
                  minWidth: 0,
                  my: 0,
                }}
              />
              <Button
                variant="outlined"
                size="small"
                color="warning"
                onClick={() => setResetDialogOpen(true)}
                sx={{
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                  flexShrink: 0,
                  ml: { xs: 6, sm: 0 },
                }}
              >
                Reset
              </Button>
            </ListItem>
            <Divider />

            {/* Version */}
            <ListItem>
              <InfoIcon sx={{ mr: 2 }} color="action" />
              <ListItemText primary="Version" secondary="1.0.0" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Reset Confirmation */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Cache zurücksetzen?</DialogTitle>
        <DialogContent>
          <Typography>
            Der Service Worker und alle Caches werden gelöscht. Die Seite wird neu geladen.
            Deine Übungsdaten bleiben erhalten (IndexedDB wird nicht gelöscht).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleCacheReset} color="warning" variant="contained">
            Cache zurücksetzen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
