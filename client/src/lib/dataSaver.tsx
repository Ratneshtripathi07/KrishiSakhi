"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'km_data_saver';

type Ctx = { enabled: boolean; setEnabled: (v: boolean) => void };
const DataSaverContext = createContext<Ctx>({ enabled: false, setEnabled: () => {} });

export function DataSaverProvider({ children }: { children: React.ReactNode }) {
  const [enabled, set] = useState(false);
  useEffect(() => {
    try { set((localStorage.getItem(STORAGE_KEY) || 'false') === 'true'); } catch {}
  }, []);
  const setEnabled = (v: boolean) => {
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
    set(v);
  };
  const value = useMemo(() => ({ enabled, setEnabled }), [enabled]);
  return <DataSaverContext.Provider value={value}>{children}</DataSaverContext.Provider>;
}

export function useDataSaver() {
  return useContext(DataSaverContext);
}