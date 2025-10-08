"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { ask } from '@/services/chatService';
import { useI18n } from '@/lib/i18n';
import VoiceButton from '@/components/voice/VoiceButton';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [crop, setCrop] = useState('');
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords({}),
      );
    }
  }, []);

  const sendingRef = useRef(false);
  const lastMsgRef = useRef<string>('');
  const lastTsRef = useRef<number>(0);

  const doAsk = async (q: string) => {
    setError(null);
    const msg = (q || '').trim();
    if (!msg) { setError(t('ask_question')); return; }
    if (loading || sendingRef.current) return; // guard against duplicate triggers
    const norm = msg.replace(/\s+/g, ' ').toLowerCase();
    const now = Date.now();
    if (norm === lastMsgRef.current && now - lastTsRef.current < 5000) return; // dedupe within 5s

    sendingRef.current = true;
    lastMsgRef.current = norm;
    lastTsRef.current = now;

    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setText('');
    setLoading(true);
    try {
      const res = await ask({ text: msg, crop: crop || undefined, lat: coords.lat, lon: coords.lon });
      setMessages((m) => [...m, { role: 'assistant', text: res.answer || '' }]);
    } catch (err: any) {
      setError(err.message || 'Query failed');
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doAsk(text);
  };

  useEffect(() => {
    // Auto-scroll to bottom when messages update
    try {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    } catch {}
  }, [messages]);

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await doAsk(text);
    }
  };

  function BootstrapQuery() {
    const searchParams = useSearchParams();
    const triggeredRef = useRef(false);
    useEffect(() => {
      const q = searchParams?.get('q');
      if (q && !triggeredRef.current) {
        triggeredRef.current = true;
        setText(q);
        doAsk(q);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);
    return null;
  }

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F1F5F9] dark:bg-[#121212]">
      <div className="mx-auto max-w-none px-0 md:px-4 py-0 md:py-4">
        <Suspense fallback={null}>
          <BootstrapQuery />
        </Suspense>

        {/* Messenger-like full-height layout */}
        <div className="flex flex-col h-[calc(100vh-96px)] md:h-[calc(100vh-112px)]">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-white/90 dark:bg-[#121212]/90 dark:border-gray-800 backdrop-blur">
            <h1 className="text-2xl md:text-3xl font-semibold">{t('chat_title') || 'Ask Krishi Mitra'}</h1>
          </div>

          {/* Messages list */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-3 pb-28 md:pb-4">
            {messages.length === 0 && !loading && (
              <div className="text-center text-gray-600 text-base mt-8">{t('question_placeholder') || 'Ask anything about your crop, weather, irrigation or pests…'}</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-900 border dark:bg-[#1E1E1E] dark:text-gray-100 dark:border-gray-700'} px-4 py-3 rounded-2xl shadow-sm max-w-[88%] md:max-w-[70%] text-base leading-relaxed`}>{m.text}</div>
              </div>
            ))}
            {loading && <div className="text-sm text-gray-600 dark:text-gray-400">…</div>}
          </div>

          {/* Composer */}
          <div className="sticky bottom-[72px] md:bottom-0 w-full border-t bg-white dark:bg-[#121212] dark:border-gray-800 px-3 md:px-6 py-3 z-20" style={{ bottom: '72px' }}>
            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <VoiceButton onTranscript={(tx) => doAsk(tx)} title={t('voice') || 'Voice'} />
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t('ask_question') || 'Type your message…'}
                className="flex-1 rounded-2xl px-4 py-2"
              />
              <Button disabled={loading || !text.trim()} className="rounded-2xl px-4">
                {loading ? (t('thinking') || 'Thinking…') : (t('ask_button') || 'Send')}
              </Button>
              {/* Optional crop on wide screens */}
              <div className="hidden md:flex items-center gap-2">
                <Input
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  placeholder={t('crop_optional') || 'Crop (optional)'}
                  className="w-48 rounded-xl"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
