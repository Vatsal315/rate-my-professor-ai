'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark';

export const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: 'light',
  toggle: () => {},
});



export default function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const initMode = (): ThemeMode => {
      if (typeof window === 'undefined') return 'light';
      const stored = window.localStorage.getItem('theme-mode');
      return (stored === 'dark' || stored === 'light') ? stored : 'light';
    };
    setMode(initMode());
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme-mode', mode);
    }
  }, [mode]);

  const toggle = () => setMode(m => (m === 'light' ? 'dark' : 'light'));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'light' ? '#2563eb' : '#60a5fa' },
          secondary: { main: mode === 'light' ? '#7c3aed' : '#a78bfa' },
          background: {
            default: mode === 'light' ? '#f6f7fb' : '#0b1220',
            paper: mode === 'light' ? '#ffffff' : '#0f172a',
          },
        },
        shape: { borderRadius: 14 },
        typography: {
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          h1: { fontWeight: 800 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 700 },
        },
        components: {
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { textTransform: 'none', borderRadius: 10 } },
          },
          MuiAppBar: { styleOverrides: { root: { borderBottom: '1px solid #e2e8f0' } } },
          MuiPaper: { styleOverrides: { root: { borderRadius: 14 } } },
        },
      }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}


