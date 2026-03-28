import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  Typography,
  Paper,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <HomeIcon />, path: '/' },
  { label: 'Übungen', icon: <FitnessCenterIcon />, path: '/exercises' },
  { label: 'Vorlage', icon: <CalendarMonthIcon />, path: '/template' },
  { label: 'Einstellungen', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentIndex = NAV_ITEMS.findIndex((item) => item.path === location.pathname);
  const [value, setValue] = useState(currentIndex >= 0 ? currentIndex : 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar position="fixed" color="default" elevation={1} sx={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.85)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {NAV_ITEMS[value]?.label ?? 'Weekly Workout'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Toolbar /> {/* spacer for fixed AppBar */}

      <Box component="main" sx={{ flex: 1, p: 2, pb: 10, overflow: 'auto' }}>
        {children}
      </Box>

      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_, newValue) => {
            setValue(newValue);
            navigate(NAV_ITEMS[newValue].path);
          }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
