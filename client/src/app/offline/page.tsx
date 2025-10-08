"use client";

import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/button';

export default function OfflinePage() {
  const { t } = useI18n();
  const retry = () => { try { window.location.reload(); } catch {} };
  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-xl border shadow-sm p-6 text-center space-y-5 bg-white/80">
        <div className="flex items-center justify-center">
          <img src="/icon.svg" alt="Krishi Mitra" className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('offline_title') || 'You are offline'}</h1>
        <p className="text-gray-700 text-sm">{t('offline_message') || 'Some features are unavailable without internet. Please check your connection and try again.'}</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={retry} aria-label={t('retry') || 'Retry'}>{t('retry') || 'Retry'}</Button>
          <Button href="/" variant="outline" aria-label={t('go_home') || 'Go Home'}>{t('go_home') || 'Go Home'}</Button>
        </div>
        <div className="text-xs text-gray-500">{t('offline_tip') || 'Tip: You can still view previously loaded weather and market data if cached.'}</div>
      </div>
    </div>
  );
}
