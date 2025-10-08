"use client";

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const install = async () => {
    try {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
    } catch {
      setVisible(false);
    }
  };

  if (!visible) return null;
  return (
    <div className="fixed bottom-3 inset-x-0 px-4 z-50">
      <div className="mx-auto max-w-md rounded-md border bg-white shadow flex items-center justify-between p-3">
        <div className="text-sm text-gray-700">Install Krishi Mitra for quick access</div>
        <div className="space-x-2">
          <button onClick={() => setVisible(false)} className="text-sm rounded-md border px-3 py-1 hover:border-brand">Not now</button>
          <button onClick={install} className="text-sm rounded-md bg-brand px-3 py-1 text-white">Install</button>
        </div>
      </div>
    </div>
  );
}