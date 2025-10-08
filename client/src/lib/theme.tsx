"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'km_theme';

const ThemeContext = createContext<{ mode: ThemeMode; setMode: (m: ThemeMode) => void; toggle: () => void }>({ mode: 'light', setMode: () => {}, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) || '').toLowerCase();
      if (saved === 'dark' || saved === 'light') {
        setMode(saved as ThemeMode);
      } else {
        // Default to light; do not auto-switch based on system
        setMode('light');
      }
    } catch {
      // Fallback to light if anything goes wrong
      setMode('light');
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
    if (typeof document !== 'undefined') {
      const el = document.documentElement;
      if (mode === 'dark') el.classList.add('dark'); else el.classList.remove('dark');
    }
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
