'use client';

import { useEffect } from 'react';

export default function ChunkReload() {
  useEffect(() => {
    const KEY = 'km_chunk_reload_once';

    const shouldReload = (msg: any) => {
      try {
        const text = (
          msg?.reason?.message ||
          msg?.reason ||
          msg?.message ||
          ''
        ).toString();
        return /ChunkLoadError|Loading chunk|Importing a module script failed|dynamically imported module/i.test(text);
      } catch {
        return false;
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      if (shouldReload(e) && !sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
    };

    const onError = (e: ErrorEvent) => {
      if (shouldReload(e) && !sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError);
    };
  }, []);
  return null;
}