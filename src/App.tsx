import { useState, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { buildTheme } from './utils/theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Template from './pages/Template';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const theme = useMemo(() => buildTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/template" element={<Template />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
