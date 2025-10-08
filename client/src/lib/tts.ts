"use client";

import { useI18n } from './i18n';

export function localeToLang(locale: string): string {
  const base = (locale || 'en').toLowerCase();
  if (base.startsWith('hi')) return 'hi-IN';
  if (base.startsWith('ml')) return 'ml-IN';
  if (base.startsWith('pa')) return 'pa-IN';
  return 'en-IN';
}

export function speak(text: string, lang?: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
    const utter = new SpeechSynthesisUtterance(text);
    if (lang) utter.lang = lang;
    const synth = window.speechSynthesis;
    const attempt = () => {
      const voices = synth.getVoices();
      if (voices && voices.length) {
        const v = voices.find((v) => (lang ? v.lang?.toLowerCase().startsWith(lang.split('-')[0]) : false)) || voices[0];
        if (v) utter.voice = v;
        synth.cancel();
        synth.speak(utter);
        utter.onend = () => resolve();
      } else {
        // Voices not loaded yet
        setTimeout(attempt, 250);
      }
    };
    attempt();
  });
}

export async function speakLines(lines: string[], lang?: string, gapMs = 250) {
  for (const line of lines) {
    if (!line) continue;
    // eslint-disable-next-line no-await-in-loop
    await speak(line, lang);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, gapMs));
  }
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch {}
}

export function useSpeak() {
  const { locale } = useI18n();
  const lang = localeToLang(locale);
  return {
    speak: (text: string) => speak(text, lang),
    speakLines: (lines: string[], gapMs?: number) => speakLines(lines, lang, gapMs),
    stop: () => stopSpeaking(),
    lang,
  };
}