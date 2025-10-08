"use client";

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

function getRecognition(): any | null {
  // @ts-ignore
  const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) return null;
  // @ts-ignore
  const rec: any = new SR();
  rec.lang = navigator?.language || 'en-US';
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  return rec;
}

export default function VoiceButton({ onTranscript, className, title }: { onTranscript: (t: string) => void; className?: string; title?: string }) {
  const { t } = useI18n();
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<any | null>(null);

  useEffect(() => {
    recRef.current = getRecognition();
    setSupported(!!recRef.current);
  }, []);

  const handledRef = useRef(false);

  const start = () => {
    if (!recRef.current) return;
    try {
      handledRef.current = false;
      recRef.current.onresult = (e: any) => {
        if (handledRef.current) return;
        const res = e?.results?.[e?.resultIndex ?? 0];
        if (!res || res.isFinal === false) return; // only act on final result
        const text = (res[0]?.transcript || '').trim();
        handledRef.current = true;
        if (text) onTranscript(text);
        // Stop immediately after first final result to prevent duplicate fires on some Android devices
        try { recRef.current?.stop(); } catch {}
      };
      recRef.current.onend = () => setRecording(false);
      recRef.current.onerror = () => { handledRef.current = true; setRecording(false); };
      setRecording(true);
      recRef.current.start();
    } catch {
      setRecording(false);
    }
  };

  const stop = () => {
    try { recRef.current?.stop(); } catch {}
    setRecording(false);
  };

  if (!supported) {
    return (
      <button type="button" className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm opacity-50 cursor-not-allowed dark:border-gray-700 dark:text-gray-100 ${className || ''}`} title={title || t('voice_not_supported') || 'Voice not supported'}>
        <Mic className="w-4 h-4 mr-1" /> {t('voice') || 'Voice'}
      </button>
    );
  }

  return (
    <button type="button" onClick={recording ? stop : start} className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:border-brand dark:border-gray-700 dark:text-gray-100 ${className || ''}`} title={title || (recording ? (t('stop') || 'Stop') : (t('voice') || 'Voice'))}>
      {recording ? <Square className="w-4 h-4 mr-1 text-red-600" /> : <Mic className="w-4 h-4 mr-1" />}
      {recording ? (t('stop') || 'Stop') : (t('voice') || 'Voice')}
    </button>
  );
}