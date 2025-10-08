"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import QRCode from 'react-qr-code';
import Button from '@/components/ui/button';

export default function QRPage() {
  const { t } = useI18n();
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/me');
        if (!res.ok) throw new Error('Not logged in');
        const j = await res.json();
        const u = j?.user || {};
        const payload = {
          app: 'KrishiMitra',
          id: u.id,
          name: u.name || 'Farmer',
          phone_last4: (u.phone_number || '').slice(-4),
          state: u.state,
          city: u.city,
          constituency: u.constituency
        };
        setData(payload);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      }
    })();
  }, []);

  const onDownload = () => {
    try {
      const svg = document.getElementById('km-qr');
      if (!svg) return;
      const xml = new XMLSerializer().serializeToString(svg as any);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const image64 = 'data:image/svg+xml;base64,' + svg64;
      const a = document.createElement('a');
      a.href = image64;
      a.download = 'krishi_mitra_qr.svg';
      a.click();
    } catch {}
  };

  if (error) return <div className="max-w-md mx-auto"><p className="text-red-600">{error}</p></div>;
  if (!data) return <div className="max-w-md mx-auto">{t('loading') || 'Loading…'}</div>;

  const text = JSON.stringify(data);

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">{t('farmer_qr_id') || 'Farmer QR ID'}</h1>
      <div className="rounded-md border p-4 bg-white flex items-center justify-center">
        <QRCode id="km-qr" value={text} size={192} />
      </div>
      <div className="space-x-2">
        <Button onClick={onDownload} variant="outline" size="sm">{t('download_qr') || 'Download QR'}</Button>
        <Button href="/dashboard" size="sm">{t('back_to_dashboard') || 'Back to Dashboard'}</Button>
      </div>
      <div className="text-xs text-gray-500">{t('qr_tip') || 'This QR contains a minimal public summary (no full phone number). For demo only; backend resolver not implemented.'}</div>
    </div>
  );
}