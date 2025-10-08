"use client";

import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          // eslint-disable-next-line no-console
          console.log('[sw] registered', reg.scope);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[sw] registration failed', e);
        }
      };
      register();
    }
  }, []);
  return null;
}