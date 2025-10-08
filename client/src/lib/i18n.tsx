'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../../public/locales/en/common.json';
import hi from '../../public/locales/hi/common.json';
import ml from '../../public/locales/ml/common.json';
import pa from '../../public/locales/pa/common.json';

export type Locale = 'en' | 'hi' | 'ml' | 'pa';

type Resources = Record<Locale, Record<string, string>>;
const resources: Resources = { en, hi, ml, pa } as const;

const STORAGE_KEY = 'km_locale';

export function detectLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = (localStorage.getItem(STORAGE_KEY) || '').toLowerCase();
    if (['en', 'hi', 'ml', 'pa'].includes(saved)) return saved as Locale;
  }
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('pa')) return 'pa';
    if (lang.startsWith('hi')) return 'hi';
    if (lang.startsWith('ml')) return 'ml';
  }
  return 'en';
}

function translate(key: string, locale: Locale): string {
  return resources[locale][key] || resources['en'][key] || key;
}

export const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}>({ locale: 'en', setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  const setLocale = (l: Locale) => {
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    setLocaleState(l);
  };

  const t = useMemo(() => (key: string) => translate(key, locale), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export const supportedLocales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ml', label: 'മലയാളം' }
];