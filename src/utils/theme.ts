import { createTheme, type Theme } from '@mui/material/styles';

export function buildTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#4A90D9',
      },
      secondary: {
        main: '#FF6B6B',
      },
      background: mode === 'dark'
        ? { default: '#121212', paper: '#1E1E1E' }
        : { default: '#F5F5F5', paper: '#FFFFFF' },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });
}
