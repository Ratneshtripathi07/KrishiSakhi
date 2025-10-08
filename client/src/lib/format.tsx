"use client";

import { useMemo } from 'react';
import { useI18n } from './i18n';

export function useFormat() {
  const { locale } = useI18n();

  const numberFmt = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const percentFmt = useMemo(() => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }), [locale]);
  const currencyFmt = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [locale]);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }), [locale]);
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }), [locale]);

  const formatNumber = (n: unknown, digits?: number) => {
    const v = typeof n === 'number' ? n : Number(n);
    if (!Number.isFinite(v)) return '—';
    if (typeof digits === 'number') {
      try { return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v); } catch { /* noop */ }
    }
    return numberFmt.format(v);
  };

  const formatPercent = (p: unknown) => {
    const v = typeof p === 'number' ? p : Number(p);
    if (!Number.isFinite(v)) return '—';
    return percentFmt.format(v);
  };

  const formatCurrency = (n: unknown) => {
    const v = typeof n === 'number' ? n : Number(n);
    if (!Number.isFinite(v)) return '—';
    return currencyFmt.format(v);
  };

  const formatDate = (d: Date | number | string) => {
    try { return dateFmt.format(new Date(d)); } catch { return '—'; }
  };
  const formatTime = (d: Date | number | string) => {
    try { return timeFmt.format(new Date(d)); } catch { return '—'; }
  };

  return { formatNumber, formatPercent, formatCurrency, formatDate, formatTime };
}
