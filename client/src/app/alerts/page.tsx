"use client";

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BellRing } from 'lucide-react';
import { useFormat } from '@/lib/format';
import EmptyState from '@/components/ui/empty-state';
import { Bell } from 'lucide-react';
import { prettifyKey } from '@/lib/labels';

export default function AlertsPage() {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<any[]>([]);
  const { formatDate } = useFormat();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/alerts/me');
        setAlerts(res.data?.alerts || []);
      } catch (e: any) {
        setError(t('failed_to_load_alerts') || 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-3" role="status" aria-live="polite">
      <div className="rounded-md border p-3">
        <div className="h-3 w-24 animate-pulse bg-gray-200 rounded mb-2" />
        <div className="h-4 w-64 animate-pulse bg-gray-200 rounded" />
      </div>
      <div className="rounded-md border p-3">
        <div className="h-3 w-24 animate-pulse bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 animate-pulse bg-gray-200 rounded" />
      </div>
      <div className="rounded-md border p-3">
        <div className="h-3 w-24 animate-pulse bg-gray-200 rounded mb-2" />
        <div className="h-4 w-56 animate-pulse bg-gray-200 rounded" />
      </div>
    </div>
  );

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F1F5F9]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-semibold mb-4">{t('my_alerts') || 'Notifications'}</h1>
        {error && <p className="text-red-600" aria-live="assertive">{error}</p>}
        {alerts.length === 0 ? (
          <EmptyState title={t('no_alerts_yet') || 'No alerts yet.'} icon={<Bell className="w-4 h-4 text-amber-700" />} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((a, idx) => (
              <div key={idx} className={`rounded-2xl border p-4 shadow-sm hover:shadow transition-all ${idx % 3 === 0 ? 'bg-amber-100' : idx % 3 === 1 ? 'bg-sky-100' : 'bg-emerald-100'}`}>
                <div className="text-xs text-gray-700">{formatDate(a.created_at)}</div>
                <div className="text-lg font-semibold">{prettifyKey(a.alert_type)}</div>
                <div className="text-base text-gray-900">{a.content_text || prettifyKey(a.content_key)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
