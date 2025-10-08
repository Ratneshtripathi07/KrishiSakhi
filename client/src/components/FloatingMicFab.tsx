"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

function getRecognition(): any | null {
  // @ts-ignore
  const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) return null;
  // @ts-ignore
  const rec: any = new SR();
  rec.lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  return rec;
}

export default function FloatingMicFab() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<any | null>(null);

  useEffect(() => {
    recRef.current = getRecognition();
    setSupported(!!recRef.current);
  }, []);

  const vibrate = (ms: number) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        // @ts-ignore
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const onClick = () => {
    vibrate(30);
    if (!supported) { router.push('/chat'); return; }
    try {
      recRef.current.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript || '';
        if (text) {
          const q = encodeURIComponent(text);
          router.push(`/chat?q=${q}`);
        } else {
          router.push('/chat');
        }
      };
      recRef.current.onend = () => { setRecording(false); vibrate(15); };
      recRef.current.onerror = () => { setRecording(false); router.push('/chat'); };
      setRecording(true);
      recRef.current.start();
    } catch {
      setRecording(false);
      router.push('/chat');
    }
  };

  if (pathname.startsWith('/chat')) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('voice') || 'Voice'}
      title={t('voice') || 'Voice'}
      className="fixed right-6 z-50 rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand md:[--fab-bottom:1.5rem] [--fab-bottom:6rem]"
      style={{ width: 64, height: 64, backgroundColor: '#2E7D32', bottom: 'calc(var(--fab-bottom, 1.5rem) + env(safe-area-inset-bottom))' }}
    >
      <Mic className="w-7 h-7 text-white mx-auto" aria-hidden="true" />
    </button>
  );
}
